import React from 'react';
import { Text } from 'react-native';
import renderer, {
  act,
  type ReactTestRenderer,
} from 'react-test-renderer';

import {
  BlueprintDevelopmentGuard,
  isBlueprintDevelopmentEnabled,
} from '../src/dev';

describe('Blueprint development guard', () => {
  it('does not render Blueprint content when explicitly disabled', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintDevelopmentGuard
          enabled={false}
          fallback={<Text testID="runtime-app">Runtime app</Text>}
        >
          <Text testID="blueprint-ui">Blueprint</Text>
        </BlueprintDevelopmentGuard>,
      );
    });

    expect(
      view.root.findAllByProps({ testID: 'blueprint-ui' }),
    ).toHaveLength(0);
    expect(
      view.root.findByProps({ testID: 'runtime-app' }),
    ).toBeDefined();
  });

  it('renders Blueprint content when explicitly enabled', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintDevelopmentGuard enabled>
          <Text testID="blueprint-ui">Blueprint</Text>
        </BlueprintDevelopmentGuard>,
      );
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-ui' }),
    ).toBeDefined();
  });

  it('allows explicit flags to override the host __DEV__ value', () => {
    expect(isBlueprintDevelopmentEnabled(false)).toBe(false);
    expect(isBlueprintDevelopmentEnabled(true)).toBe(true);
  });
});
