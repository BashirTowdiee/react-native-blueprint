import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { createBlueprintScreenRegistry } from '@react-native-blueprint/core';
import {
  BlueprintPreviewHost,
  BlueprintView,
  type ReactNativeBlueprintScreen,
} from '@react-native-blueprint/react-native';
import {
  createReactNavigationStaticManifest,
  createReactNavigationRouteVariant,
  registerReactNavigationScreens,
  type ReactNavigationStaticNavigator,
} from '@react-native-blueprint/react-navigation';

function HomeScreen() {
  return (
    <View>
      <Text>Home</Text>
    </View>
  );
}

function StoriesScreen() {
  return (
    <View>
      <Text>Stories</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View>
      <Text>Profile</Text>
    </View>
  );
}

function RemoteFeatureScreen() {
  return (
    <View>
      <Text>Runtime registered feature</Text>
    </View>
  );
}

const navigation: ReactNavigationStaticNavigator<React.ComponentType<any>> = {
  kind: 'stack',
  screens: {
    Home: HomeScreen,
    Library: {
      kind: 'tab',
      screens: {
        Stories: StoriesScreen,
        Profile: ProfileScreen,
      },
    },
  },
};

const registry = createBlueprintScreenRegistry(
  createReactNavigationStaticManifest(navigation),
);

registerReactNavigationScreens(registry, [
  {
    routeName: 'RemoteFeature',
    screen: RemoteFeatureScreen,
    params: { source: 'runtime' },
    variants: [
      createReactNavigationRouteVariant({
        id: 'sample',
        name: 'Sample runtime route',
        routeName: 'RemoteFeature',
        params: { source: 'runtime', id: 'sample' },
      }),
    ],
  },
]);

const screens = registry.list();

export default function App() {
  const artboards = useMemo(
    () =>
      screens.flatMap((screen) => {
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
            />
          ),
        }));
      }),
    [],
  );

  return <BlueprintView artboards={artboards} />;
}
