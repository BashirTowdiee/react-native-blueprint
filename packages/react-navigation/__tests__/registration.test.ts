import { createBlueprintScreenRegistry } from '@react-native-blueprint/core';

import {
  createReactNavigationPreviewContext,
  createReactNavigationRouteVariant,
  createReactNavigationStaticManifest,
  registerReactNavigationScreens,
} from '../src';

const Home = () => null;
const UpdatedHome = () => null;
const DynamicFeature = () => null;

describe('React Navigation dynamic registration', () => {
  it('supplements static discovery and can intentionally replace a discovered screen', () => {
    const discovered = createReactNavigationStaticManifest({
      kind: 'stack',
      screens: {
        Home,
      },
    });
    const registry = createBlueprintScreenRegistry(discovered);

    registerReactNavigationScreens(registry, [
      {
        routeName: 'DynamicFeature',
        screen: DynamicFeature,
        params: { source: 'runtime' },
      },
    ]);

    expect(registry.list().map((screen) => screen.id)).toEqual([
      'react-navigation:Home',
      'react-navigation:DynamicFeature',
    ]);

    registerReactNavigationScreens(
      registry,
      [
        {
          id: 'react-navigation:Home',
          routeName: 'Home',
          screen: UpdatedHome,
          label: 'Runtime Home',
          metadata: { source: 'manual' },
        },
      ],
      { replace: true },
    );

    expect(registry.get('react-navigation:Home')).toMatchObject({
      name: 'Runtime Home',
      render: UpdatedHome,
      metadata: {
        registration: 'manual',
        source: 'manual',
      },
    });
  });

  it('creates route-param variants through the common manifest contract', () => {
    const variant = createReactNavigationRouteVariant({
      id: 'user-42',
      name: 'User 42',
      routeName: 'Profile',
      params: { userId: '42' },
      render: DynamicFeature,
    });

    expect(variant).toMatchObject({
      id: 'user-42',
      route: { params: { userId: '42' } },
      render: DynamicFeature,
      metadata: {
        adapter: 'react-navigation',
        routeName: 'Profile',
      },
    });
  });

  it('creates deterministic preview route and navigation context', () => {
    const actions: unknown[] = [];
    const context = createReactNavigationPreviewContext({
      routeName: 'Profile',
      params: { userId: '42' },
      canGoBack: true,
      onAction: (action) => actions.push(action),
    });

    context.navigation.navigate('Settings', { tab: 'account' });
    context.navigation.push('Details');
    context.navigation.goBack();

    expect(context.route).toEqual({
      key: 'blueprint:Profile',
      name: 'Profile',
      params: { userId: '42' },
    });
    expect(context.navigation.canGoBack()).toBe(true);
    expect(actions).toEqual([
      { type: 'navigate', name: 'Settings', params: { tab: 'account' } },
      { type: 'push', name: 'Details' },
      { type: 'goBack' },
    ]);
  });
});
