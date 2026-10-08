import React from 'react';
import { ScrollView, Text } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { BlueprintView, createBlueprintViewportFromPreset } from '../src';

describe('BlueprintView', () => {
  it('renders data-driven artboards and keeps zoom controls bounded', async () => {
    let view!: ReactTestRenderer;

    await act(async () => {
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

    await act(async () => {
      view.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('150%');

    await act(async () => {
      view.root.findByProps({ testID: 'blueprint-zoom-out' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('140%');
  });

  it('groups variants, selects artboards and exposes viewport metadata', async () => {
    let view!: ReactTestRenderer;

    await act(async () => {
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

    expect(
      view.root.findByProps({ testID: 'blueprint-group-login' }),
    ).toBeDefined();

    await act(async () => {
      view.root
        .findByProps({ testID: 'blueprint-artboard-login:default-select' })
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
    await act(async () => view.root.findAllByProps({ accessibilityLabel: 'Show screen info' }).find((node) => node.props.onPress)!.props.onPress());
    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-metadata' }).props
        .children,
    ).toContain('expo-router');
  });

  it('resets zoom and selection to their configured defaults', async () => {
    let view!: ReactTestRenderer;

    await act(async () => {
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

    await act(async () => {
      view.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
      view.root
        .findByProps({ testID: 'blueprint-artboard-second-select' })
        .props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-second' }),
    ).toBeDefined();

    await act(async () => {
      view.root.findByProps({ testID: 'blueprint-reset' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('75%');
    expect(
      view.root.findByProps({ testID: 'blueprint-inspector-first' }),
    ).toBeDefined();
  });

  it('fits and recentres a horizontal canvas containing all screen groups', async () => {
    let view!: ReactTestRenderer;

    await act(async () => {
      view = renderer.create(
        <BlueprintView
          artboards={[
            {
              id: 'home',
              label: 'Default',
              groupId: 'home',
              groupLabel: 'Home',
              content: <Text>Home</Text>,
            },
            {
              id: 'login',
              label: 'Default',
              groupId: 'login',
              groupLabel: 'Login',
              content: <Text>Login</Text>,
            },
          ]}
          initialZoom={0.5}
          minZoom={0.1}
        />,
      );
    });

    await act(async () => {
      view.root
        .findByProps({ testID: 'blueprint-canvas-workspace' })
        .props.onLayout({
          nativeEvent: {
            layout: {
              width: 1000,
              height: 800,
            },
          },
        });
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('85%');

    await act(async () => {
      view.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('90%');

    await act(async () => {
      view.root.findByProps({ testID: 'blueprint-fit' }).props.onPress();
    });

    expect(
      view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children,
    ).toBe('85%');
  });

  it('provides device presets while allowing arbitrary custom viewports', async () => {
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


it('offers Focus active after panning or zooming away and restores framing without a remount', async () => {
  let mounts = 0;
  function Screen() {
    React.useEffect(() => { mounts++; }, []);
    return <Text>Active content</Text>;
  }
  let view!: ReactTestRenderer;
  await act(async () => { view = renderer.create(<BlueprintView
    artboards={[{ id: 'active', label: 'Active', width: 390, height: 844, content: <Screen /> }]}
    layout="hierarchy" focusRequest={{ id: 'active', sequence: 0 }} initialZoom={0.65} fitOnMount={false}
  />); });
  await act(async () => view.root.findByProps({ testID: 'blueprint-canvas-workspace' }).props.onLayout({ nativeEvent: { layout: { width: 600, height: 700 } } }));
  const scrolls = () => view.root.findAllByType(ScrollView).filter((node) => node.props.onScroll);
  await act(async () => {
    scrolls()[0].props.onScroll({ nativeEvent: { contentOffset: { y: 338 } } });
    scrolls()[1].props.onScroll({ nativeEvent: { contentOffset: { x: 165.75 } } });
  });
  expect(view.root.findAllByProps({ testID: 'blueprint-focus-active' })).toHaveLength(0);
  await act(async () => view.root.findByProps({ testID: 'blueprint-zoom-out' }).props.onPress());
  expect(view.root.findByProps({ testID: 'blueprint-focus-active' })).toBeDefined();
  await act(async () => view.root.findByProps({ testID: 'blueprint-focus-active' }).props.onPress());
  expect(view.root.findByProps({ testID: 'blueprint-zoom-value' }).props.children).toBe('65%');
  expect(view.root.findAllByProps({ testID: 'blueprint-focus-active' })).toHaveLength(0);
  await act(async () => scrolls()[0].props.onScroll({ nativeEvent: { contentOffset: { y: 700 } } }));
  expect(view.root.findByProps({ testID: 'blueprint-focus-active' })).toBeDefined();
  expect(mounts).toBe(1);
  await act(async () => view.unmount());
});

it('uses one web scroll surface and observes both camera coordinates in the same scroll event', async () => {
  const { Platform } = require('react-native');
  const os = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  let view: ReactTestRenderer | undefined;
  let mounts = 0;
  function Screen() { React.useEffect(() => { mounts++; }, []); return <Text>Active</Text>; }
  try {
    await act(async () => { view = renderer.create(<BlueprintView
      artboards={[{ id: 'active', label: 'Active', width: 390, height: 844, content: <Screen /> }]}
      layout="hierarchy" focusRequest={{ id: 'active', sequence: 0 }} initialZoom={0.65} fitOnMount={false}
    />); });
    await act(async () => view!.root.findByProps({ testID: 'blueprint-canvas-workspace' }).props.onLayout({ nativeEvent: { layout: { width: 600, height: 700 } } }));
    expect(view!.root.findAllByProps({ testID: 'blueprint-canvas-scroll-x' })).toHaveLength(0);
    expect(view!.root.findAllByProps({ testID: 'blueprint-canvas-scroll-y' })).toHaveLength(0);
    await act(async () => view!.root.findByProps({ testID: 'blueprint-canvas-scroll' }).props.onScroll({ nativeEvent: { contentOffset: { x: 165.75, y: 338 } } }));
    expect(view!.root.findAllByProps({ testID: 'blueprint-focus-active' })).toHaveLength(0);
    await act(async () => view!.root.findByProps({ testID: 'blueprint-canvas-scroll' }).props.onScroll({ nativeEvent: { contentOffset: { x: 300, y: 500 } } }));
    expect(view!.root.findByProps({ testID: 'blueprint-focus-active' })).toBeDefined();
    expect(mounts).toBe(1);
  } finally {
    if (view) await act(async () => view!.unmount());
    Object.defineProperty(Platform, 'OS', os);
  }
});
