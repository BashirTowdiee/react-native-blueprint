import type {
  BlueprintMetadata,
  BlueprintScreen,
  BlueprintScreenManifest,
  BlueprintVariant,
  BlueprintViewport,
} from '@react-native-blueprint/core';

const ROUTE_FILE_PATTERN = /\.(?:js|jsx|ts|tsx)$/;

export type ExpoRouterRouteEntry<TRender = unknown> = {
  file: string;
  render: TRender;
};

export type ExpoRouterRequireContext<TRender = unknown> = {
  keys(): readonly string[];
  (key: string): TRender | { default?: TRender };
};

export type ExpoRouterFixture<TRender = unknown> = {
  id: string;
  name: string;
  params: Readonly<Record<string, unknown>>;
  render?: TRender;
  viewport?: BlueprintViewport;
  data?: unknown;
  context?: unknown;
  metadata?: BlueprintMetadata;
};

export type ExpoRouterDiscoveryOptions<TRender = unknown> = {
  excludeFiles?: readonly string[];
  fixtures?: Readonly<
    Record<string, readonly ExpoRouterFixture<TRender>[]>
  >;
};

export type ExpoRouterScreenMetadata = BlueprintMetadata & {
  adapter: 'expo-router';
  file: string;
  routeGroups: readonly string[];
  dynamicSegments: readonly string[];
  fixtureRequired: boolean;
  fixtureStatus: 'not-required' | 'ready' | 'missing' | 'invalid';
  fixtureMessage?: string;
  fixtureIssues?: readonly string[];
};

export function discoverExpoRouterScreens<TRender>(
  entries: readonly ExpoRouterRouteEntry<TRender>[],
  options: ExpoRouterDiscoveryOptions<TRender> = {},
): BlueprintScreenManifest<TRender> {
  const excluded = new Set(
    (options.excludeFiles ?? []).map(normalizeComparableFile),
  );

  return entries
    .filter((entry) => isScreenFile(entry.file))
    .filter((entry) => !excluded.has(normalizeComparableFile(entry.file)))
    .map((entry) => createScreen(entry, options))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function discoverExpoRouterScreensFromContext<TRender>(
  context: ExpoRouterRequireContext<TRender>,
  options: ExpoRouterDiscoveryOptions<TRender> = {},
): BlueprintScreenManifest<TRender> {
  const excluded = new Set((options.excludeFiles ?? []).map(normalizeComparableFile));
  // Do not evaluate IDE routes, layouts or special files just to discard them.
  const entries = context.keys().filter(file => isScreenFile(file) && !excluded.has(normalizeComparableFile(file))).map((file) => {
    const module = context(file);
    const render = isDefaultModule(module) ? module.default : module;

    if (render === undefined) {
      throw new Error(
        `Expo Router route "${file}" does not expose a default screen export.`,
      );
    }

    return {
      file,
      render,
    };
  });

  return discoverExpoRouterScreens(entries, options);
}

function createScreen<TRender>(
  entry: ExpoRouterRouteEntry<TRender>,
  options: ExpoRouterDiscoveryOptions<TRender>,
): BlueprintScreen<TRender> {
  const routeFile = normalizeRouteFile(entry.file);
  const sourceSegments = routeFile.split('/').filter(Boolean);
  const routeGroups = sourceSegments
    .filter(isRouteGroup)
    .map((segment) => segment.slice(1, -1));
  const routeSegments = sourceSegments.filter((segment) => !isRouteGroup(segment));
  const last = routeSegments.at(-1);

  if (last === 'index') {
    routeSegments.pop();
  }

  const dynamicSegments = routeSegments
    .map(getDynamicSegmentName)
    .filter((value): value is string => value !== null);
  const pathname = `/${routeSegments.join('/')}` || '/';
  const id = `expo-router:${routeFile}`;
  const fixtures = findFixtures(options.fixtures, entry.file, routeFile, id, pathname);
  const fixtureResult = createFixtureVariants(
    pathname,
    dynamicSegments,
    fixtures,
  );
  const metadata: ExpoRouterScreenMetadata = {
    adapter: 'expo-router',
    file: entry.file,
    routeGroups,
    dynamicSegments,
    fixtureRequired: dynamicSegments.length > 0,
    fixtureStatus: fixtureResult.status,
    ...(fixtureResult.message ? { fixtureMessage: fixtureResult.message } : {}),
    ...(fixtureResult.issues.length > 0
      ? { fixtureIssues: fixtureResult.issues }
      : {}),
  };

  return {
    id,
    name: createLabel(routeSegments),
    render: entry.render,
    route: {
      pathname,
    },
    ...(fixtureResult.variants.length > 0
      ? { variants: fixtureResult.variants }
      : {}),
    metadata,
  };
}

function findFixtures<TRender>(
  fixtures: ExpoRouterDiscoveryOptions<TRender>['fixtures'],
  file: string,
  routeFile: string,
  id: string,
  pathname: string,
): readonly ExpoRouterFixture<TRender>[] {
  if (!fixtures) {
    return [];
  }

  const candidates = new Set([
    normalizeComparableFile(file),
    routeFile,
    id,
    pathname,
  ]);

  for (const [key, values] of Object.entries(fixtures)) {
    const comparable = key.startsWith('/') ? key : normalizeComparableFile(key);
    if (candidates.has(comparable)) {
      return values;
    }
  }

  return [];
}

function createFixtureVariants<TRender>(
  pathname: string,
  dynamicSegments: readonly string[],
  fixtures: readonly ExpoRouterFixture<TRender>[],
): {
  status: ExpoRouterScreenMetadata['fixtureStatus'];
  message?: string;
  issues: readonly string[];
  variants: readonly BlueprintVariant<TRender>[];
} {
  if (dynamicSegments.length === 0 && fixtures.length === 0) {
    return {
      status: 'not-required',
      issues: [],
      variants: [],
    };
  }

  if (dynamicSegments.length > 0 && fixtures.length === 0) {
    return {
      status: 'missing',
      message: `Route ${pathname} requires fixture params: ${dynamicSegments.join(', ')}.`,
      issues: [],
      variants: [],
    };
  }

  const issues: string[] = [];
  const variants: BlueprintVariant<TRender>[] = [];

  for (const fixture of fixtures) {
    const missingParams = dynamicSegments.filter(
      (segment) => !Object.prototype.hasOwnProperty.call(fixture.params, segment),
    );

    if (missingParams.length > 0) {
      issues.push(
        `${fixture.id} is missing params: ${missingParams.join(', ')}.`,
      );
      continue;
    }

    variants.push({
      id: fixture.id,
      name: fixture.name,
      ...(fixture.render === undefined ? {} : { render: fixture.render }),
      route: {
        pathname,
        params: fixture.params,
      },
      ...(fixture.viewport ? { viewport: fixture.viewport } : {}),
      metadata: {
        ...(fixture.metadata ?? {}),
        adapter: 'expo-router',
        fixtureData: fixture.data,
        fixtureContext: fixture.context,
      },
    });
  }

  if (issues.length > 0) {
    return {
      status: 'invalid',
      message: `Some fixtures for ${pathname} are missing required route params.`,
      issues,
      variants,
    };
  }

  return {
    status: 'ready',
    issues: [],
    variants,
  };
}

function normalizeComparableFile(file: string): string {
  return normalizeSlashes(file).replace(/^\.\//, '');
}

function normalizeRouteFile(file: string): string {
  const normalized = normalizeComparableFile(file).replace(ROUTE_FILE_PATTERN, '');
  const appIndex = normalized.lastIndexOf('/app/');

  if (appIndex >= 0) {
    return normalized.slice(appIndex + '/app/'.length);
  }

  if (normalized.startsWith('app/')) {
    return normalized.slice('app/'.length);
  }

  if (normalized.startsWith('src/app/')) {
    return normalized.slice('src/app/'.length);
  }

  return normalized;
}

function isScreenFile(file: string): boolean {
  const normalized = normalizeRouteFile(file);
  const filename = normalized.split('/').at(-1) ?? '';

  if (!ROUTE_FILE_PATTERN.test(file)) {
    return false;
  }

  if (filename === '_layout' || filename.startsWith('+')) {
    return false;
  }

  return filename.length > 0;
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')');
}

function getDynamicSegmentName(segment: string): string | null {
  const optionalCatchAll = segment.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (optionalCatchAll) {
    return optionalCatchAll[1];
  }

  const catchAll = segment.match(/^\[\.\.\.(.+)\]$/);
  if (catchAll) {
    return catchAll[1];
  }

  const dynamic = segment.match(/^\[(.+)\]$/);
  return dynamic?.[1] ?? null;
}

function createLabel(routeSegments: readonly string[]): string {
  const candidate = [...routeSegments]
    .reverse()
    .find((segment) => getDynamicSegmentName(segment) === null);

  if (!candidate) {
    return 'Home';
  }

  return candidate
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/');
}

function isDefaultModule<TRender>(
  value: TRender | { default?: TRender },
): value is { default?: TRender } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, 'default')
  );
}
