import React from 'react';
import { Text } from 'react-native';
import renderer, {
  act,
  type ReactTestRenderer,
} from 'react-test-renderer';

import {
  BlueprintView,
  createBlueprintViewportFromPreset,
} from '../src';

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

  it('groups variants, selects artboards and exposes viewport metadata', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintView
          artboards={[
            {
              id: 'login:default',
              label: 'Default',
              groupId: 'login',
              groupLabel: 'Login',
              viewport: {
                name: 'Phone',
                width: 390,
                height: 844,
              },
              metadata: {
                adapter: 'expo-router',
                file: './login.tsx',
              },
              content: <Text>Login preview</Text>,
            },
            {
              id: 'login:error',
              label: 'Error',
              groupId: 'login',
              groupLabel: 'Login',
              content: <Text>Error preview</Text>,
            },
          ]}
        />,
      );
    });

    expect(view.root.findByProps({ testID: 'blueprint-group-login' })).toBeDefined();

    act(() => {
      view.root
        .findByProps({ testID: 'blueprint-artboard-login:default' })
        .props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-login:default' }),
    ).toBeDefined();
    expect(
      view.root.findByProps({
        testID: 'blueprint-artboard-login:default-viewport',
      }).props.children,
    ).toContain('390 × 844');
    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-metadata' }).props
        .children,
    ).toContain('expo-router');
  });

  it('resets zoom and selection to their configured defaults', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintView
          artboards={[
            {
              id: 'first',
              label: 'First',
              content: <Text>First</Text>,
            },
            {
              id: 'second',
              label: 'Second',
              content: <Text>Second</Text>,
            },
          ]}
          defaultSelectedArtboardId="first"
          initialZoom={0.75}
        />,
      );
    });

    act(() => {
      view.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
      view.root
        .findByProps({ testID: 'blueprint-artboard-second' })
        .props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-second' }),
    ).toBeDefined();

    act(() => {
      view.root.findByProps({ testID: 'blueprint-reset' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('75%');
    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-first' }),
    ).toBeDefined();
  });

  it('provides device presets while allowing arbitrary custom viewports', () => {
    expect(createBlueprintViewportFromPreset('phone-standard')).toEqual({
      name: 'Standard phone',
      width: 390,
      height: 844,
    });
    expect(() => createBlueprintViewportFromPreset('unknown')).toThrow(
      RangeError,
    );
  });
});
