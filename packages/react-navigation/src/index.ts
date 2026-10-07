import type {
  BlueprintMetadata,
  BlueprintRegisterOptions,
  BlueprintScreen,
  BlueprintScreenManifest,
  BlueprintScreenRegistry,
  BlueprintVariant,
} from '@react-native-blueprint/core';
import { registerBlueprintScreens } from '@react-native-blueprint/core';

export type ReactNavigationNavigatorKind =
  | 'stack'
  | 'tab'
  | 'drawer'
  | 'custom';

export type ReactNavigationStaticScreenConfig<TRender = unknown> = {
  screen: TRender;
  label?: string;
  initialParams?: Readonly<Record<string, unknown>>;
  variants?: readonly BlueprintVariant<TRender>[];
  metadata?: BlueprintMetadata;
};

export type ReactNavigationStaticNavigator<TRender = unknown> = {
  kind: ReactNavigationNavigatorKind;
  screens: Readonly<
    Record<
      string,
      | TRender
      | ReactNavigationStaticScreenConfig<TRender>
      | ReactNavigationStaticNavigator<TRender>
    >
  >;
  metadata?: BlueprintMetadata;
};

export type ReactNavigationScreenMetadata = BlueprintMetadata & {
  adapter: 'react-navigation';
  routeNames: readonly string[];
  navigatorKinds: readonly ReactNavigationNavigatorKind[];
  navigatorPath: string;
  registration?: 'static' | 'manual';
};

export type ReactNavigationScreenRegistration<TRender = unknown> = {
  id?: string;
  routeName: string;
  screen: TRender;
  label?: string;
  params?: Readonly<Record<string, unknown>>;
  variants?: readonly BlueprintVariant<TRender>[];
  metadata?: BlueprintMetadata;
};

export type ReactNavigationPreviewAction =
  | {
      type: 'navigate' | 'push';
      name: string;
      params?: Readonly<Record<string, unknown>>;
    }
  | {
      type: 'goBack';
    };

export type ReactNavigationPreviewContext = {
  route: {
    key: string;
    name: string;
    params: Readonly<Record<string, unknown>>;
  };
  navigation: {
    navigate(
      name: string,
      params?: Readonly<Record<string, unknown>>,
    ): void;
    push(
      name: string,
      params?: Readonly<Record<string, unknown>>,
    ): void;
    goBack(): void;
    canGoBack(): boolean;
  };
};

export type ReactNavigationPreviewContextOptions = {
  routeName: string;
  params?: Readonly<Record<string, unknown>>;
  canGoBack?: boolean;
  onAction?: (action: ReactNavigationPreviewAction) => void;
};

export type ReactNavigationVariantOptions<TRender = unknown> = {
  id: string;
  name: string;
  routeName: string;
  params?: Readonly<Record<string, unknown>>;
  render?: TRender;
  metadata?: BlueprintMetadata;
};

export function createReactNavigationStaticManifest<TRender>(
  navigator: ReactNavigationStaticNavigator<TRender>,
): BlueprintScreenManifest<TRender> {
  return walkNavigator(navigator, [], []).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function walkNavigator<TRender>(
  navigator: ReactNavigationStaticNavigator<TRender>,
  parentRouteNames: readonly string[],
  parentKinds: readonly ReactNavigationNavigatorKind[],
): BlueprintScreen<TRender>[] {
  const kinds = [...parentKinds, navigator.kind];
  const screens: BlueprintScreen<TRender>[] = [];

  for (const [routeName, value] of Object.entries(navigator.screens)) {
    const routeNames = [...parentRouteNames, routeName];

    if (isStaticNavigator<TRender>(value)) {
      screens.push(...walkNavigator(value, routeNames, kinds));
      continue;
    }

    const config = isStaticScreenConfig<TRender>(value)
      ? value
      : { screen: value as TRender };
    const metadata: ReactNavigationScreenMetadata = {
      ...(navigator.metadata ?? {}),
      ...(config.metadata ?? {}),
      adapter: 'react-navigation',
      routeNames,
      navigatorKinds: kinds,
      navigatorPath: routeNames.join('/'),
      registration: 'static',
    };

    screens.push({
      id: `react-navigation:${routeNames.join('/')}`,
      name: config.label ?? humanizeRouteName(routeName),
      render: config.screen,
      ...(config.initialParams
        ? {
            route: {
              params: config.initialParams,
            },
          }
        : {}),
      ...(config.variants ? { variants: config.variants } : {}),
      metadata,
    });
  }

  return screens;
}

export function registerReactNavigationScreens<TRender>(
  registry: BlueprintScreenRegistry<TRender>,
  registrations: readonly ReactNavigationScreenRegistration<TRender>[],
  options: BlueprintRegisterOptions = {},
): BlueprintScreenManifest<TRender> {
  const screens = registrations.map(createRegisteredScreen);
  return registerBlueprintScreens(registry, screens, options);
}

export function createReactNavigationRouteVariant<TRender>(
  options: ReactNavigationVariantOptions<TRender>,
): BlueprintVariant<TRender> {
  return {
    id: options.id,
    name: options.name,
    ...(options.render === undefined ? {} : { render: options.render }),
    route: {
      params: options.params ?? {},
    },
    metadata: {
      ...(options.metadata ?? {}),
      adapter: 'react-navigation',
      routeName: options.routeName,
    },
  };
}

export function createReactNavigationPreviewContext(
  options: ReactNavigationPreviewContextOptions,
): ReactNavigationPreviewContext {
  const emit = (action: ReactNavigationPreviewAction) => {
    options.onAction?.(action);
  };

  return {
    route: {
      key: `blueprint:${options.routeName}`,
      name: options.routeName,
      params: options.params ?? {},
    },
    navigation: {
      navigate(name, params) {
        emit({ type: 'navigate', name, ...(params ? { params } : {}) });
      },
      push(name, params) {
        emit({ type: 'push', name, ...(params ? { params } : {}) });
      },
      goBack() {
        emit({ type: 'goBack' });
      },
      canGoBack() {
        return options.canGoBack ?? false;
      },
    },
  };
}

function createRegisteredScreen<TRender>(
  registration: ReactNavigationScreenRegistration<TRender>,
): BlueprintScreen<TRender> {
  const id = registration.id ?? `react-navigation:${registration.routeName}`;
  const metadata: ReactNavigationScreenMetadata = {
    ...(registration.metadata ?? {}),
    adapter: 'react-navigation',
    routeNames: [registration.routeName],
    navigatorKinds: ['custom'],
    navigatorPath: registration.routeName,
    registration: 'manual',
  };

  return {
    id,
    name: registration.label ?? humanizeRouteName(registration.routeName),
    render: registration.screen,
    ...(registration.params
      ? {
          route: {
            params: registration.params,
          },
        }
      : {}),
    ...(registration.variants
      ? { variants: registration.variants }
      : {}),
    metadata,
  };
}

function isStaticNavigator<TRender>(
  value:
    | TRender
    | ReactNavigationStaticScreenConfig<TRender>
    | ReactNavigationStaticNavigator<TRender>,
): value is ReactNavigationStaticNavigator<TRender> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'screens' in value &&
    'kind' in value
  );
}

function isStaticScreenConfig<TRender>(
  value:
    | TRender
    | ReactNavigationStaticScreenConfig<TRender>
    | ReactNavigationStaticNavigator<TRender>,
): value is ReactNavigationStaticScreenConfig<TRender> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'screen' in value &&
    !('screens' in value)
  );
}

function humanizeRouteName(routeName: string): string {
  return routeName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}
