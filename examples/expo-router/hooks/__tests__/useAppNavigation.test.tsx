import React from 'react';
import { Pressable } from 'react-native';
import renderer, {
  act,
  type ReactTestRenderer,
} from 'react-test-renderer';

import {
  AppNavigationProvider,
  type AppNavigation,
  useAppNavigation,
} from '../useAppNavigation';

function NavigationProbe() {
  const navigation = useAppNavigation();

  return (
    <>
      <Pressable
        testID="navigation-push-probe"
        onPress={() => navigation.push('/story-list')}
      />
      <Pressable
        testID="navigation-replace-probe"
        onPress={() => navigation.replace('/login')}
      />
    </>
  );
}

describe('AppNavigationProvider', () => {
  it('lets a nested preview navigation boundary override host navigation', () => {
    const hostNavigation: AppNavigation = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };
    const previewNavigation: AppNavigation = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };

    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <AppNavigationProvider navigation={hostNavigation}>
          <AppNavigationProvider navigation={previewNavigation}>
            <NavigationProbe />
          </AppNavigationProvider>
        </AppNavigationProvider>,
      );
    });

    act(() => {
      view.root.findByProps({ testID: 'navigation-push-probe' }).props.onPress();
      view.root.findByProps({ testID: 'navigation-replace-probe' }).props.onPress();
    });

    expect(previewNavigation.push).toHaveBeenCalledWith('/story-list');
    expect(previewNavigation.replace).toHaveBeenCalledWith('/login');
    expect(hostNavigation.push).not.toHaveBeenCalled();
    expect(hostNavigation.replace).not.toHaveBeenCalled();
  });
});
