import React from 'react';
import { Text } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import {
  BlueprintView,
  BlueprintInspectable,
  useBlueprintPreviewViewport,
} from '../src';

function SnapshotScreen({ likes }: { likes: number }) {
  return (
    <BlueprintInspectable id="post" name="PostCard" data={{ post: { likes } }}>
      <Text>Post</Text>
    </BlueprintInspectable>
  );
}
it('pins a baseline, compares live data and exports the comparison and history', async () => {
  let view!: ReactTestRenderer;
  const copy = jest.fn();
  const boards = (likes: number) => [
    { id: 'feed', label: 'Feed', content: <SnapshotScreen likes={likes} /> },
  ];
  await act(async () => {
    view = renderer.create(
      <BlueprintView artboards={boards(24)} onCopy={copy} />,
    );
  });
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-inspect-toggle' })
      .props.onPress();
  });
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-pick-post' }).props.onPress();
  });
  await act(async () => view.root.findByProps({ label: 'Data' }).props.onPress());
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-pin-snapshot' }).props.onPress();
  });
  await act(async () => {
    view.update(<BlueprintView artboards={boards(25)} onCopy={copy} />);
  });
  const diff = view.root.findByProps({
    testID: 'blueprint-snapshot-comparison',
  });
  expect(
    diff
      .findAllByType(Text)
      .map((t) => t.props.children)
      .flat()
      .join(' '),
  ).toContain('/post/likes');
  await act(async () => {
    await view.root
      .findByProps({ testID: 'blueprint-copy-report' })
      .props.onPress();
  });
  const report = JSON.parse(copy.mock.calls[0][0]);
  expect(report.comparison.pinnedData.post.likes).toBe(24);
  expect(report.component.data.post.likes).toBe(25);
  expect(report.history[0].changes[0]).toMatchObject({
    path: '/post/likes',
    before: '24',
    after: '25',
  });
  await act(async () => {
    await view.root
      .findByProps({ testID: 'blueprint-copy-component' })
      .props.onPress();
  });
  expect(JSON.parse(copy.mock.calls[1][0]).post.likes).toBe(25);
  await act(async () => view.unmount());
});

it('changes viewport presets and rotation without losing state and publishes dimensions to adapters', async () => {
  let mounts = 0;
  function Screen() {
    const viewport = useBlueprintPreviewViewport();
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
      mounts += 1;
    }, []);
    return (
      <Text
        testID="dimensions"
        onPress={() => setCount((c) => c + 1)}
      >{`${viewport?.width}x${viewport?.height}:${count}`}</Text>
    );
  }
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintView
        defaultSelectedArtboardId="a"
        artboards={[
          {
            id: 'a',
            label: 'A',
            viewport: { width: 430, height: 932 },
            content: <Screen />,
          },
        ]}
      />,
    );
  });
  await act(async () => {
    view.root.findByProps({ testID: 'dimensions' }).props.onPress();
  });
  const viewportTab = view.root
    .findAllByProps({ accessibilityLabel: 'Viewport' })
    .find((node) => node.props.onPress)!;
  await act(async () => {
    viewportTab.props.onPress();
  });
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-device-tablet-portrait' })
      .props.onPress();
  });
  expect(view.root.findByProps({ testID: 'dimensions' }).props.children).toBe(
    '768x1024:1',
  );
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-rotate-viewport' })
      .props.onPress();
  });
  expect(view.root.findByProps({ testID: 'dimensions' }).props.children).toBe(
    '1024x768:1',
  );
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-restore-viewport' })
      .props.onPress();
  });
  expect(view.root.findByProps({ testID: 'dimensions' }).props.children).toBe(
    '430x932:1',
  );
  expect(mounts).toBe(1);
  await act(async () => view.unmount());
});

it('writes the component-only payload through the default web clipboard adapter', async () => {
  const { Platform } = require('react-native');
  const originalOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  );
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { clipboard: { writeText } },
  });
  let view: ReactTestRenderer | undefined;
  try {
    await act(async () => {
      view = renderer.create(
        <BlueprintView
          artboards={[
            {
              id: 'feed',
              label: 'Feed',
              content: <SnapshotScreen likes={25} />,
            },
          ]}
        />,
        { createNodeMock: () => ({}) },
      );
    });
    await act(async () => {
      view!.root
        .findByProps({ testID: 'blueprint-inspect-toggle' })
        .props.onPress();
    });
    await act(async () => {
      view!.root.findAllByProps({ accessibilityLabel: 'Select artboard Feed' }).find((node) => node.props.onPress)!.props.onPress();
    });
    await act(async () => {
      view!.root.findAllByProps({ label: 'Components' })[0].props.onPress();
    });
    await act(async () => {
      view!.root.findAllByProps({ accessibilityLabel: 'Select component PostCard' })
        .find((node) => node.props.onPress)!.props.onPress();
    });
    await act(async () => view!.root.findByProps({ label: 'Data' }).props.onPress());
    await act(async () => {
      await view!.root
        .findByProps({ testID: 'blueprint-copy-component' })
        .props.onPress();
    });
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({
      post: { likes: 25 },
    });
    await act(async () => {
      await view!.root
        .findByProps({ testID: 'blueprint-copy-report' })
        .props.onPress();
    });
    expect(
      JSON.parse(writeText.mock.calls[1][0]).component.data.post.likes,
    ).toBe(25);
  } finally {
    if (view) await act(async () => view!.unmount());
    if (originalOS) Object.defineProperty(Platform, 'OS', originalOS);
    if (originalNavigator)
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete (globalThis as any).navigator;
  }
});
