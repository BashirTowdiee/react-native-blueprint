import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import { BlueprintView } from '../BlueprintView';
import {
  clampBlueprintScale,
  getNextBlueprintScale,
} from '../zoom';

describe('BlueprintView', () => {
  it('renders generic artboards with data-driven dimensions and labels', () => {
    const tree = renderer.create(
      <BlueprintView
        showControls={false}
        artboards={[
          {
            id: 'profile',
            label: 'Profile',
            width: 320,
            height: 640,
            render: () => <Text>Profile preview</Text>,
          },
        ]}
      />,
    );

    const artboard = tree.root.findByProps({
      testID: 'blueprint-artboard-profile',
    });
    const style = StyleSheet.flatten(artboard.props.style);

    expect(style.width).toBe(320);
    expect(style.height).toBe(640);
    expect(tree.root.findByProps({ children: 'Profile' })).toBeTruthy();
    expect(tree.root.findByProps({ children: 'Profile preview' })).toBeTruthy();
  });

  it('keeps zoom changes within configured bounds', () => {
    expect(clampBlueprintScale(0.1, 0.3, 2)).toBe(0.3);
    expect(clampBlueprintScale(3, 0.3, 2)).toBe(2);
    expect(
      getNextBlueprintScale(2, 'in', {
        minScale: 0.3,
        maxScale: 2,
        step: 0.25,
      }),
    ).toBe(2);
    expect(
      getNextBlueprintScale(0.3, 'out', {
        minScale: 0.3,
        maxScale: 2,
        step: 0.25,
      }),
    ).toBe(0.3);
  });

  it('updates the visible scale through Blueprint controls', () => {
    const tree = renderer.create(
      <BlueprintView
        initialScale={1}
        minScale={0.5}
        maxScale={1.5}
        zoomStep={0.5}
        artboards={[]}
      />,
    );

    expect(tree.root.findByProps({ children: '100%' })).toBeTruthy();

    act(() => {
      tree.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
    });

    expect(tree.root.findByProps({ children: '150%' })).toBeTruthy();

    act(() => {
      tree.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
    });

    expect(tree.root.findByProps({ children: '150%' })).toBeTruthy();
  });
});
