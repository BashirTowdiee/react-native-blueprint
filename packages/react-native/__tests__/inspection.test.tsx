import React from 'react';
import { Text } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import {
  BlueprintView,
  BlueprintInspectable,
  serializeBlueprintData,
} from '../src';
import { createInspectionStore } from '../src/inspection';

it('serializes circular, big integer and sensitive data safely', async () => {
  const object: any = {
    password: 'do-not-export',
    apiToken: 'private',
    nested: { authorization: 'private', count: BigInt(42) },
  };
  object.self = object;
  const result = serializeBlueprintData(object);
  expect(result).not.toContain('private');
  expect(result).not.toContain('do-not-export');
  expect(result).toContain('[Circular]');
  expect(result).toContain('42');
  expect(serializeBlueprintData('x'.repeat(60000))).toContain('Truncated');
});

it('tracks commits, refreshes and selected component cleanup without updating the canvas', async () => {
  const store = createInspectionStore();
  store.register('a', { id: 'post', name: 'Post', data: '{}' });
  store.select('a', 'post');
  store.commit('a', 4, 100);
  store.commit('a', 6, 200);
  expect(store.getSnapshot().metrics.a).toMatchObject({
    commits: 2,
    totalDuration: 10,
    lastDuration: 6,
  });
  store.refresh('a');
  expect(store.getSnapshot().metrics.a).toMatchObject({
    commits: 0,
    refreshes: 1,
  });
  store.remove('a', 'post');
  expect(store.getSnapshot().selected).toBeUndefined();
});

it('picks a component, keeps live data searchable and copies a structured report', async () => {
  let view!: ReactTestRenderer;
  const onCopy = jest.fn();
  const artboards = (likes: number) => [
    {
      id: 'feed',
      label: 'Feed',
      content: (
        <BlueprintInspectable
          id="post"
          name="PostCard"
          data={{ likes, title: 'Find this post' }}
        >
          <Text>Post</Text>
        </BlueprintInspectable>
      ),
    },
  ];
  await act(async () => {
    view = renderer.create(
      <BlueprintView artboards={artboards(1)} onCopy={onCopy} />,
    );
  });
  expect(
    view.root.findAllByProps({ testID: 'blueprint-pick-post' }),
  ).toHaveLength(0);
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-inspect-toggle' })
      .props.onPress();
  });
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-pick-post' }).props.onPress();
  });
  await act(async () => view.root.findByProps({ label: 'Data' }).props.onPress());
  expect(
    view.root.findByProps({ testID: 'blueprint-component-data' }).props
      .children,
  ).toContain('"likes": 1');
  await act(async () => {
    view.update(<BlueprintView artboards={artboards(2)} onCopy={onCopy} />);
  });
  expect(
    view.root.findByProps({ testID: 'blueprint-component-data' }).props
      .children,
  ).toContain('"likes": 2');
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-search' })
      .props.onChangeText('Find this post');
  });
  expect(
    view.root.findByProps({ testID: 'blueprint-find-feed' }),
  ).toBeDefined();
  await act(async () => {
    await view.root
      .findByProps({ testID: 'blueprint-copy-report' })
      .props.onPress();
  });
  expect(JSON.parse(onCopy.mock.calls[0][0]).component.data.likes).toBe(2);
  await act(async () => view.unmount());
});

it('refreshes local preview state while keeping focus switches mounted', async () => {
  let mounts = 0;
  function Screen() {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
      mounts += 1;
    }, []);
    return (
      <Text testID="counter" onPress={() => setCount((c) => c + 1)}>
        {count}
      </Text>
    );
  }
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintView
        defaultSelectedArtboardId="a"
        artboards={[
          { id: 'a', label: 'A', content: <Screen /> },
          { id: 'b', label: 'B', content: <Text>B</Text> },
        ]}
      />,
    );
  });
  await act(async () => {
    view.root.findByProps({ testID: 'counter' }).props.onPress();
  });
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-find-b' }).props.onPress();
  });
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-find-a' }).props.onPress();
  });
  expect(view.root.findByProps({ testID: 'counter' }).props.children).toBe(1);
  expect(mounts).toBe(1);
  await act(async () => {
    view.root
      .findByProps({ testID: 'blueprint-refresh-screen' })
      .props.onPress();
  });
  expect(view.root.findByProps({ testID: 'counter' }).props.children).toBe(0);
  expect(mounts).toBe(2);
  await act(async () => view.unmount());
});

it('does not render a preview when only canvas tools or panel visibility change', async () => {
  let renders = 0;
  function Screen() {
    renders += 1;
    return <Text>Stable screen</Text>;
  }
  const artboards = [{ id: 'a', label: 'A', content: <Screen /> }];
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintView artboards={artboards} defaultSelectedArtboardId="a" />,
    );
  });
  const baseline = renders;
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-zoom-in' }).props.onPress();
  });
  await act(async () => {
    view.root.findByProps({ testID: 'blueprint-focus' }).props.onPress();
  });
  expect(renders).toBe(baseline);
  await act(async () => view.unmount());
});

it('keeps large exports valid JSON with an explicit truncation notice', () => {
  const report = JSON.parse(
    serializeBlueprintData({ text: 'x'.repeat(60000) }),
  );
  expect(report.notice).toContain('Truncated');
  expect(
    serializeBlueprintData({ text: 'x'.repeat(60000) }).length,
  ).toBeLessThan(50000);
});

it('shows registered children and routes exact source metadata to copy and open actions', async () => {
  const onCopy = jest.fn();
  const onOpenSource = jest.fn();
  const location = { file: 'src/Post.tsx', line: 42, column: 3 };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintView onCopy={onCopy} onOpenSource={onOpenSource} artboards={[{
      id: 'source', label: 'Source', content: <BlueprintInspectable id="parent" name="Post" sourceLocation={location}>
        <BlueprintInspectable id="child" name="PostBody"><Text>Body</Text></BlueprintInspectable>
      </BlueprintInspectable>,
    }]} />);
  });
  await act(async () => view.root.findByProps({ testID: 'blueprint-inspect-toggle' }).props.onPress());
  await act(async () => view.root.findByProps({ testID: 'blueprint-pick-parent' }).props.onPress());
  expect(view.root.findByProps({ testID: 'blueprint-source-location' }).props.children).toBe('src/Post.tsx:42:3');
  expect(view.root.findAllByProps({ label: 'PostBody' })).toHaveLength(1);
  await act(async () => view.root.findByProps({ testID: 'blueprint-copy-source' }).props.onPress());
  expect(onCopy).toHaveBeenCalledWith('src/Post.tsx');
  await act(async () => view.root.findByProps({ testID: 'blueprint-copy-location' }).props.onPress());
  expect(onCopy).toHaveBeenCalledWith('src/Post.tsx:42:3');
  await act(async () => view.root.findByProps({ testID: 'blueprint-open-source' }).props.onPress());
  expect(onOpenSource).toHaveBeenCalledWith(location);
  await act(async () => view.root.findByProps({ label: 'PostBody' }).props.onPress());
  expect(view.root.findByProps({ testID: 'blueprint-source-location' }).props.children).toBe('src/Post.tsx:42:3');
  await act(async () => view.unmount());
});

it('retains host-element selections independently and clears them when their screen unmounts', () => {
  const store = createInspectionStore();
  store.selectElement('plain', { tag: 'button', role: 'button', children: [], childCount: 0 });
  expect(store.getSnapshot().selected?.element?.tag).toBe('button');
  store.clearSelection('other');
  expect(store.getSnapshot().selected).toBeDefined();
  store.clearSelection('plain');
  expect(store.getSnapshot().selected).toBeUndefined();
});

it('links the header picker, selected component row, source card and preview outline without showing data tools', async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintView defaultSelectedArtboardId="a" artboards={[{
      id: 'a', label: 'Settings', content: <BlueprintInspectable id="settings" name="SettingsPanel" sourceLocation={{ file: 'src/Settings.tsx', line: 12 }} data={{ theme: 'light' }}><Text>Settings</Text></BlueprintInspectable>,
    }]} />);
  });
  await act(async () => view.root.findAllByProps({ accessibilityLabel: 'Collapse details drawer' }).find((node) => node.props.onPress)!.props.onPress());
  await act(async () => view.root.findByProps({ testID: 'blueprint-inspect-toggle' }).props.onPress());
  expect(view.root.findByProps({ label: 'Components' }).props.active).toBe(true);
  await act(async () => view.root.findByProps({ testID: 'blueprint-pick-settings' }).props.onPress());
  expect(view.root.findByProps({ testID: 'blueprint-component-settings' }).props.accessibilityState.selected).toBe(true);
  expect(view.root.findByProps({ testID: 'blueprint-source-location' }).props.children).toBe('src/Settings.tsx:12');
  expect(view.root.findByProps({ testID: 'blueprint-selected-settings' })).toBeDefined();
  expect(view.root.findAllByProps({ testID: 'blueprint-pin-snapshot' })).toHaveLength(0);
  expect(view.root.findAllByProps({ testID: 'blueprint-component-data' })).toHaveLength(0);
  await act(async () => view.root.findByProps({ testID: 'blueprint-inspect-toggle' }).props.onPress());
  await act(async () => view.root.findByProps({ testID: 'blueprint-component-settings' }).props.onPress());
  expect(view.root.findByProps({ label: 'Components' }).props.active).toBe(true);
  expect(view.root.findByProps({ testID: 'blueprint-selected-settings' })).toBeDefined();
  await act(async () => view.unmount());
});

it('lets source boundaries register without covering native child pick targets', async () => {
  let view!: ReactTestRenderer;
  await act(async () => { view = renderer.create(<BlueprintView defaultSelectedArtboardId="a" artboards={[{
    id: 'a', label: 'A', content: <BlueprintInspectable name="Layout" id="layout" pickable={false} source="src/Layout.tsx">
      <BlueprintInspectable name="Button" id="button"><Text>Button</Text></BlueprintInspectable>
    </BlueprintInspectable>,
  }]} />); });
  await act(async () => view.root.findByProps({ testID: 'blueprint-inspect-toggle' }).props.onPress());
  expect(view.root.findAllByProps({ testID: 'blueprint-pick-layout' })).toHaveLength(0);
  expect(view.root.findByProps({ testID: 'blueprint-pick-button' })).toBeDefined();
  await act(async () => view.root.findByProps({ testID: 'blueprint-component-layout' }).props.onPress());
  expect(view.root.findByProps({ testID: 'blueprint-selected-layout' })).toBeDefined();
  await act(async () => view.unmount());
});
