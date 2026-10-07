import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import {
  BlueprintPreviewHost,
  BlueprintView,
  type ReactNativeBlueprintScreen,
} from '@react-native-blueprint/react-native';
import {
  createReactNavigationStaticManifest,
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

const screens = createReactNavigationStaticManifest(navigation);

export default function App() {
  const artboards = useMemo(
    () =>
      screens.map((screen) => ({
        id: screen.id,
        label: screen.name,
        content: (
          <BlueprintPreviewHost
            screen={screen as ReactNativeBlueprintScreen}
          />
        ),
      })),
    [],
  );

  return <BlueprintView artboards={artboards} />;
}
