import React, { type ComponentType, useMemo } from 'react';
import {
  discoverExpoRouterScreensFromContext,
  type ExpoRouterRequireContext,
} from '@react-native-blueprint/expo-router';
import {
  BlueprintPreviewHost,
  BlueprintView,
  type ReactNativeBlueprintScreen,
} from '@react-native-blueprint/react-native';

import {
  AppNavigationProvider,
  type AppNavigation,
} from '../../hooks/useAppNavigation';

declare global {
  interface NodeRequire {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp,
    ): ExpoRouterRequireContext<ComponentType<any>>;
  }
}

const previewNavigation: AppNavigation = {
  push() {},
  back() {},
};

const routeContext = require.context(
  '..',
  true,
  /^\.\/.*\.(?:ts|tsx)$/,
) as ExpoRouterRequireContext<ComponentType<any>>;

const discoveredScreens = discoverExpoRouterScreensFromContext(routeContext, {
  excludeFiles: ['./(ide)/index.tsx'],
});

export default function BlueprintRoute() {
  const artboards = useMemo(
    () =>
      discoveredScreens.map((screen) => ({
        id: screen.id,
        label: screen.name,
        width: screen.viewport?.width,
        height: screen.viewport?.height,
        content: (
          <BlueprintPreviewHost
            screen={screen as ReactNativeBlueprintScreen}
            wrapPreview={(preview) => (
              <AppNavigationProvider navigation={previewNavigation}>
                {preview}
              </AppNavigationProvider>
            )}
          />
        ),
      })),
    [],
  );

  return <BlueprintView artboards={artboards} />;
}
