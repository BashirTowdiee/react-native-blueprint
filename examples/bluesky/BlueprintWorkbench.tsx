// Installed into the pinned upstream checkout by scripts/setup-bluesky-showcase.mjs.
// This module runs inside Bluesky's own provider tree and only in development.
import React, { useState } from 'react';
import { Context as ResponsiveContext } from 'react-responsive';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BlueprintInspectable,
  useBlueprintPreviewViewport,
  BlueprintPreviewHost,
  BlueprintView,
  type ReactNativeBlueprintScreen,
} from '@react-native-blueprint/react-native';

import { HomeScreen } from '#/view/screens/Home';
import { NotFoundScreen } from '#/view/screens/NotFound';
import { SearchScreen } from '#/screens/Search';
import { AppearanceSettingsScreen } from '#/screens/Settings/AppearanceSettings';
import { AccessibilitySettingsScreen } from '#/screens/Settings/AccessibilitySettings';
import { useSession } from '#/state/session';
import { Provider as ShellLayoutProvider } from '#/state/shell/shell-layout';

const PREVIEW_VIEWPORT = { width: 390, height: 844, name: 'Standard phone' };
const Stack = createNativeStackNavigator();
const routes = {
  Home: HomeScreen,
  Search: SearchScreen,
  AppearanceSettings: AppearanceSettingsScreen,
  AccessibilitySettings: AccessibilitySettingsScreen,
  NotFound: NotFoundScreen,
};

const screenSources: Record<keyof typeof routes, string> = {
  Home: 'src/view/screens/Home.tsx',
  Search: 'src/screens/Search/index.tsx',
  AppearanceSettings: 'src/screens/Settings/AppearanceSettings.tsx',
  AccessibilitySettings: 'src/screens/Settings/AccessibilitySettings.tsx',
  NotFound: 'src/view/screens/NotFound.tsx',
};

function ActualScreenPreview({
  routeName,
}: {
  routeName: keyof typeof routes;
}) {
  const { currentAccount } = useSession();
  const viewport = useBlueprintPreviewViewport() ?? PREVIEW_VIEWPORT;
  const [activeRoute, setActiveRoute] = useState<string>(routeName);
  const screenKey = (
    activeRoute === 'HomeTab' ? 'Home' : activeRoute
  ) as keyof typeof routes;
  return (
    <BlueprintInspectable
      name={screenKey + 'Screen'}
      source={screenSources[screenKey] ?? 'Unknown upstream route'}
      data={{
        initialRoute: routeName,
        activeRoute,
        viewport,
        session: currentAccount ? 'signed-in' : 'signed-out',
        providers: 'Inherited from Bluesky InnerApp; shared across previews',
      }}
      style={{ flex: 1 }}
    >
      <ResponsiveContext.Provider value={viewport}>
        <ShellLayoutProvider>
          <NavigationContainer
            independent
            onStateChange={(state) => {
              const active = state?.routes[state.index ?? 0];
              if (active?.name) setActiveRoute(active.name);
            }}
          >
            <Stack.Navigator
              initialRouteName={routeName}
              screenOptions={{ headerShown: false }}
            >
              {Object.entries(routes).map(([name, component]) => (
                <Stack.Screen
                  key={name}
                  name={name}
                  component={component as React.ComponentType<any>}
                />
              ))}
              <Stack.Screen
                name="HomeTab"
                component={HomeScreen as React.ComponentType<any>}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ShellLayoutProvider>
      </ResponsiveContext.Provider>
    </BlueprintInspectable>
  );
}

const manifest: ReactNativeBlueprintScreen[] = (
  Object.keys(routes) as (keyof typeof routes)[]
).map((name) => ({
  id: 'bluesky-' + name,
  name,
  render: () => <ActualScreenPreview routeName={name} />,
  viewport: PREVIEW_VIEWPORT,
  metadata: {
    app: 'Bluesky',
    release: '1.100.0',
    commit: 'bf69672674cfff39e8796b60c9f37dc7f0c9d53a',
    preview:
      'Real upstream screen; application providers and services are shared',
  },
}));

export default function BlueprintWorkbench() {
  if (!__DEV__) return null;
  return (
    <View style={styles.root}>
      <BlueprintView
        defaultSelectedArtboardId="bluesky-Home"
        minZoom={0.08}
        artboards={manifest.map((screen) => ({
          id: screen.id,
          label: screen.name,
          metadata: screen.metadata,
          viewport: screen.viewport,
          content: <BlueprintPreviewHost screen={screen} />,
        }))}
      />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, minHeight: 700 } });
