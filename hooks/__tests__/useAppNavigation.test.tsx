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
    <Pressable
      testID="navigation-probe"
      onPress={() => navigation.push('/story-list')}
    />
  );
}

describe('AppNavigationProvider', () => {
  it('lets a nested preview navigation boundary override host navigation', () => {
    const hostNavigation: AppNavigation = {
      push: jest.fn(),
      back: jest.fn(),
    };
    const previewNavigation: AppNavigation = {
      push: jest.fn(),
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
      view.root.findByProps({ testID: 'navigation-probe' }).props.onPress();
    });

    expect(previewNavigation.push).toHaveBeenCalledWith('/story-list');
    expect(hostNavigation.push).not.toHaveBeenCalled();
  });
});
