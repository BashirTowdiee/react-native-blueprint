import type {
  BlueprintMetadata,
  BlueprintScreen,
  BlueprintScreenManifest,
  BlueprintVariant,
} from '@react-native-blueprint/core';

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
