import React from 'react';
import { Text } from 'react-native';
import renderer, {
  act,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { BlueprintView } from '../src';

describe('BlueprintView', () => {
  it('renders data-driven artboards and keeps zoom controls bounded', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintView
          artboards={[
            {
              id: 'first',
              label: 'First screen',
              content: <Text>First content</Text>,
              width: 320,
              height: 640,
            },
            {
              id: 'second',
              label: 'Second screen',
              content: <Text>Second content</Text>,
            },
          ]}
          initialZoom={10}
          minZoom={0.5}
          maxZoom={1.5}
          zoomStep={0.1}
        />,
      );
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-artboard-first' }),
    ).toBeDefined();
    expect(
      view.root.findByProps({ testID: 'blueprint-artboard-second' }),
    ).toBeDefined();
    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('150%');

    act(() => {
      view.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('150%');

    act(() => {
      view.root.findByProps({ testID: 'blueprint-zoom-out' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('140%');
  });
});
