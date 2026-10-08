import React, { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  type BlueprintFlowRoute,
  type BlueprintNavigationFlowConfig,
} from '@react-native-blueprint/react-native';
import {
  SocialAppProvider,
  SocialScreen,
  type SocialPage,
  type SocialNavigationParams,
} from './SocialApp';

const route = (
  page: SocialPage,
  params?: SocialNavigationParams,
): BlueprintFlowRoute => ({
  id: page,
  name: page,
  pathname: `/social/${page.toLowerCase()}`,
  params,
});
function withAppProviders(screens: ReactNode) {
  return <SocialAppProvider>{screens}</SocialAppProvider>;
}

export const socialFlow: BlueprintNavigationFlowConfig = {
  initialRoute: route('Feed'),
  navigationMap: {
    nodes: [
      { route: route('Feed') },
      ...(
        [
          'Thread',
          'Profile',
          'Search',
          'Notifications',
          'Settings',
        ] as SocialPage[]
      ).map((page) => ({ route: route(page), parentId: 'Feed' })),
      { route: route('Compose'), parentId: 'Thread' },
    ],
  },
  wrapScreens: withAppProviders,
  renderScreen(screen, navigation) {
    const params = screen.params as SocialNavigationParams | undefined;
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            padding: 12,
            backgroundColor: '#edf5fc',
            gap: 12,
          }}
        >
          {navigation.canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back in flow"
              onPress={navigation.goBack}
            >
              <Text style={{ color: '#336084' }}>‹ Back</Text>
            </Pressable>
          ) : null}
          <Text style={{ flex: 1, color: '#336084' }}>{screen.name}</Text>
          {screen.id !== 'Settings' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open flow settings"
              onPress={() => navigation.navigate(route('Settings'))}
            >
              <Text style={{ color: '#336084' }}>Settings</Text>
            </Pressable>
          ) : null}
        </View>
        <SocialScreen
          initialPage={screen.name as SocialPage}
          initialState={params?.state}
          initialPostId={params?.postId}
          notice={params?.notice}
          inspectionIdPrefix={`flow-${screen.id}:`}
          onNavigate={(page, params) =>
            navigation.navigate(route(page, params))
          }
        />
      </View>
    );
  },
};
