import type {
  BlueprintMetadata,
  BlueprintScreen,
  BlueprintScreenManifest,
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

export type ExpoRouterDiscoveryOptions = {
  excludeFiles?: readonly string[];
};

export type ExpoRouterScreenMetadata = BlueprintMetadata & {
  adapter: 'expo-router';
  file: string;
  routeGroups: readonly string[];
  dynamicSegments: readonly string[];
  fixtureRequired: boolean;
};

export function discoverExpoRouterScreens<TRender>(
  entries: readonly ExpoRouterRouteEntry<TRender>[],
  options: ExpoRouterDiscoveryOptions = {},
): BlueprintScreenManifest<TRender> {
  const excluded = new Set(
    (options.excludeFiles ?? []).map(normalizeComparableFile),
  );

  return entries
    .filter((entry) => isScreenFile(entry.file))
    .filter((entry) => !excluded.has(normalizeComparableFile(entry.file)))
    .map((entry) => createScreen(entry))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function discoverExpoRouterScreensFromContext<TRender>(
  context: ExpoRouterRequireContext<TRender>,
  options: ExpoRouterDiscoveryOptions = {},
): BlueprintScreenManifest<TRender> {
  const entries = context.keys().map((file) => {
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
  const metadata: ExpoRouterScreenMetadata = {
    adapter: 'expo-router',
    file: entry.file,
    routeGroups,
    dynamicSegments,
    fixtureRequired: dynamicSegments.length > 0,
  };

  return {
    id: `expo-router:${routeFile}`,
    name: createLabel(routeSegments),
    render: entry.render,
    route: {
      pathname,
    },
    metadata,
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
