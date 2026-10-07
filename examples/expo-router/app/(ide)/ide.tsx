import React, { type ComponentType, useMemo } from 'react';
import { Redirect } from 'expo-router';
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
  isBlueprintDevelopmentEnabled,
} from '@react-native-blueprint/react-native/dev';

import PassageScreen from '../../components/PassageScreen';
import StudyScreen from '../../components/StudyScreen';
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
  replace() {},
  back() {},
};

function PassageOnePreview() {
  return <PassageScreen passageId="1" />;
}

function PassageTwoPreview() {
  return <PassageScreen passageId="2" />;
}

function StudyOnePreview() {
  return <StudyScreen passageId="1" />;
}

const routeContext = require.context(
  '..',
  true,
  /^\.\/.*\.(?:ts|tsx)$/,
) as ExpoRouterRequireContext<ComponentType<any>>;

const discoveredScreens = discoverExpoRouterScreensFromContext(routeContext, {
  excludeFiles: ['./(ide)/ide.tsx'],
  fixtures: {
    '/passage/[id]': [
      {
        id: 'journey',
        name: 'The Journey',
        params: { id: '1' },
        render: PassageOnePreview,
      },
      {
        id: 'city-dreams',
        name: 'City Dreams',
        params: { id: '2' },
        render: PassageTwoPreview,
      },
    ],
    '/study/[id]': [
      {
        id: 'journey-study',
        name: 'Journey Study',
        params: { id: '1' },
        render: StudyOnePreview,
      },
    ],
  },
});

export default function BlueprintRoute() {
  return isBlueprintDevelopmentEnabled()
    ? <BlueprintCanvas />
    : <Redirect href="/" />;
}

function BlueprintCanvas() {
  const artboards = useMemo(
    () =>
      discoveredScreens.flatMap((screen) => {
        const variants = screen.variants?.length ? screen.variants : [undefined];

        return variants.map((variant) => ({
          id: variant ? `${screen.id}:${variant.id}` : screen.id,
          label: variant?.name ?? 'Default',
          groupId: screen.id,
          groupLabel: screen.name,
          viewport: variant?.viewport ?? screen.viewport,
          metadata: {
            ...(screen.metadata ?? {}),
            ...(variant?.metadata ?? {}),
          },
          content: (
            <BlueprintPreviewHost
              screen={screen as ReactNativeBlueprintScreen}
              variant={variant}
              wrapPreview={(preview) => (
                <AppNavigationProvider navigation={previewNavigation}>
                  {preview}
                </AppNavigationProvider>
              )}
            />
          ),
        }));
      }),
    [],
  );

  return <BlueprintView artboards={artboards} />;
}
