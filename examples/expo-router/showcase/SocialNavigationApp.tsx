import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  NavigationContainer,
  NavigationIndependentTree,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useBlueprintNavigationReporter } from '@react-native-blueprint/react-native';
import {
  SocialAppProvider,
  SocialScreen,
  type SocialPage,
  type SocialNavigationParams,
} from './SocialApp';

type SocialRoutes = {
  [page in SocialPage]: SocialNavigationParams | undefined;
};
const Stack = createNativeStackNavigator<SocialRoutes>();
const pages: SocialPage[] = [
  'Feed',
  'Thread',
  'Profile',
  'Notifications',
  'Search',
  'Compose',
  'Settings',
];

function SocialRoute({
  route,
  navigation,
}: NativeStackScreenProps<SocialRoutes, SocialPage>) {
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: '#edf5fc',
        }}
      >
        {navigation.canGoBack() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back in app"
            onPress={() => navigation.goBack()}
            style={{ paddingRight: 12 }}
          >
            <Text style={{ color: '#336084' }}>‹ Back</Text>
          </Pressable>
        ) : null}
        <Text style={{ flex: 1, color: '#336084' }}>{route.name}</Text>
        {route.name !== 'Settings' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open app settings"
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={{ color: '#336084' }}>Settings</Text>
          </Pressable>
        ) : null}
      </View>
      <SocialScreen
        initialPage={route.name}
        initialState={route.params?.state}
        initialPostId={route.params?.postId}
        notice={route.params?.notice}
        inspectionIdPrefix={`${route.key}:`}
        onNavigate={(page, params) => {
          if (page === 'Feed') navigation.popTo('Feed', params);
          else navigation.navigate(page, params);
        }}
      />
    </View>
  );
}

/** One app-owned stack; Blueprint observes it without creating other screens. */
export function SocialNavigationApp() {
  const navigation = useNavigationContainerRef<SocialRoutes>();
  const reportRoute = useBlueprintNavigationReporter();
  const observeRoute = () => {
    const route = navigation.getCurrentRoute();
    if (route)
      reportRoute({
        name: route.name,
        pathname: `/social/${route.name.toLowerCase()}`,
        params: route.params,
      });
  };

  return (
    <SocialAppProvider>
      <NavigationIndependentTree>
        <NavigationContainer
          ref={navigation}
          onReady={observeRoute}
          onStateChange={observeRoute}
        >
          <Stack.Navigator
            initialRouteName="Feed"
            screenOptions={{ headerShown: false, animation: 'none' }}
          >
            {pages.map((name) => (
              <Stack.Screen key={name} name={name} component={SocialRoute} />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </SocialAppProvider>
  );
}
