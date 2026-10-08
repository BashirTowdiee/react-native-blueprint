import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { BlueprintWorkspace, useBlueprintNavigationReporter } from '../src';

function setup(retainVisited = false) {
  const events: string[] = [];
  function Screen({ id }: { id: string }) {
    useEffect(() => {
      events.push(`mount:${id}`);
      return () => {
        events.push(`unmount:${id}`);
      };
    }, []);
    return <Text testID={`screen-${id}`}>{id}</Text>;
  }
  function Application() {
    const report = useBlueprintNavigationReporter();
    const [page, setPage] = useState('Feed');
    const [visited, setVisited] = useState(['Feed']);
    const [count, setCount] = useState(0);
    useEffect(() => {
      events.push('mount:app');
      return () => {
        events.push('unmount:app');
      };
    }, []);
    useEffect(() => {
      report({
        name: page,
        pathname: `/${page}`,
        params: { token: 'private', id: '123' },
      });
    }, [page, report]);
    return (
      <View>
        <Text testID="app-counter" onPress={() => setCount((n) => n + 1)}>
          {count}
        </Text>
        <Text
          testID="app-navigate"
          onPress={() => {
            setPage('Search');
            setVisited(['Feed', 'Search']);
          }}
        >
          Search
        </Text>
        {(retainVisited ? visited : [page]).map((id) => (
          <Screen key={id} id={id} />
        ))}
      </View>
    );
  }
  const artboards = ['fixture-feed', 'fixture-search'].map((id) => ({
    id,
    label: id,
    content: <Screen id={id} />,
  }));
  const application = <Application />;
  return { events, artboards, application };
}

async function press(view: ReactTestRenderer, testID: string) {
  await act(async () => view.root.findByProps({ testID }).props.onPress());
}

it('mounts one app and lets its navigator unmount screens, without mounting fixtures', async () => {
  const { events, ...props } = setup();
  const copy = jest.fn();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintWorkspace {...props} previewProps={{ onCopy: copy }} />,
    );
  });
  expect(events).toEqual(['mount:Feed', 'mount:app']);
  expect(view.root.findAllByProps({ testID: 'blueprint-focus' })).toHaveLength(
    0,
  );
  await press(view, 'app-counter');
  await press(view, 'app-navigate');
  expect(events).toEqual([
    'mount:Feed',
    'mount:app',
    'unmount:Feed',
    'mount:Search',
  ]);
  expect(view.root.findByProps({ testID: 'app-counter' }).props.children).toBe(
    1,
  );
  await press(view, 'blueprint-copy-report');
  const report = JSON.parse(copy.mock.calls[0][0]);
  expect(report.screen.metadata.activeRoute).toEqual({
    name: 'Search',
    pathname: '/Search',
    params: { token: '[Redacted]', id: '123' },
  });
  await act(async () => view.unmount());
});

it('leaves visited-screen retention to the app rather than forcing unmounts', async () => {
  const { events, ...props } = setup(true);
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintWorkspace {...props} />);
  });
  expect(events).not.toContain('mount:Search');
  await press(view, 'app-navigate');
  expect(events).toEqual(['mount:Feed', 'mount:app', 'mount:Search']);
  expect(
    view.root.findAllByProps({ testID: 'screen-Feed' }).length,
  ).toBeGreaterThan(0);
  await act(async () => view.unmount());
});

it('unmounts the inactive mode and mounts all fixtures, including hidden ones', async () => {
  const { events, ...props } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintWorkspace {...props} />);
  });
  await press(view, 'blueprint-mode-navigation');
  expect(events.filter((event) => event === 'mount:app')).toHaveLength(1);
  await press(view, 'blueprint-mode-all-screens');
  expect(events).toContain('unmount:app');
  expect(events).toContain('mount:fixture-feed');
  expect(events).toContain('mount:fixture-search');
  await press(view, 'blueprint-find-fixture-feed');
  expect(events).not.toContain('unmount:fixture-search');
  await press(view, 'blueprint-mode-navigation');
  expect(events).toContain('unmount:fixture-feed');
  expect(events).toContain('unmount:fixture-search');
  expect(events.filter((event) => event === 'mount:app')).toHaveLength(2);
  await act(async () => view.unmount());
});

it('restarts the whole app explicitly and resets local navigation state', async () => {
  const { events, ...props } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintWorkspace {...props} />);
  });
  await press(view, 'app-counter');
  await press(view, 'app-navigate');
  expect(
    view.root.findByProps({ testID: 'blueprint-refresh-screen' }).props.label,
  ).toBe('Restart app');
  await press(view, 'blueprint-refresh-screen');
  expect(view.root.findByProps({ testID: 'app-counter' }).props.children).toBe(
    0,
  );
  expect(events).toContain('unmount:Search');
  expect(events.filter((event) => event === 'mount:app')).toHaveLength(2);
  await act(async () => view.unmount());
});

it('supports controlled mode changes without changing the mode prematurely', async () => {
  const { events, ...props } = setup();
  const changeMode = jest.fn();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintWorkspace
        {...props}
        mode="navigation"
        onModeChange={changeMode}
      />,
    );
  });
  await press(view, 'blueprint-mode-all-screens');
  expect(changeMode).toHaveBeenCalledWith('all-screens');
  expect(events).not.toContain('unmount:app');
  await act(async () =>
    view.update(
      <BlueprintWorkspace
        {...props}
        mode="all-screens"
        onModeChange={changeMode}
      />,
    ),
  );
  expect(events).toContain('unmount:app');
  await act(async () => view.unmount());
});

it('preserves the app instance and navigation state through viewport and inspection changes', async () => {
  const { events, ...props } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintWorkspace {...props} />);
  });
  await press(view, 'app-counter');
  await press(view, 'app-navigate');
  await act(async () =>
    view.root
      .findAllByProps({ accessibilityLabel: 'Viewport' })
      .find((node) => node.props.onPress)!
      .props.onPress(),
  );
  await press(view, 'blueprint-device-tablet-portrait');
  await press(view, 'blueprint-rotate-viewport');
  await press(view, 'blueprint-inspect-toggle');
  expect(view.root.findByProps({ testID: 'app-counter' }).props.children).toBe(
    1,
  );
  expect(
    view.root.findAllByProps({ testID: 'screen-Search' }).length,
  ).toBeGreaterThan(0);
  expect(events.filter((event) => event === 'mount:app')).toHaveLength(1);
  expect(events.filter((event) => event === 'mount:Search')).toHaveLength(1);
  await act(async () => view.unmount());
});

it('keeps modes and tools in one header and allows drawers to collapse and reopen', async () => {
  const { events, ...props } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintWorkspace {...props} />);
  });
  const header = view.root.findByProps({
    testID: 'blueprint-workspace-header',
  });
  expect(
    header.findByProps({ testID: 'blueprint-mode-all-screens' }),
  ).toBeDefined();
  expect(
    header.findByProps({ testID: 'blueprint-inspect-toggle' }).props.label,
  ).toBe('Pick component');
  expect(header.findAllByProps({ label: 'Screens' })).toHaveLength(0);
  expect(header.findAllByProps({ label: 'Details' })).toHaveLength(0);
  await act(async () =>
    view.root
      .findAllByProps({ accessibilityLabel: 'Collapse details drawer' })
      .find((node) => node.props.onPress)!
      .props.onPress(),
  );
  expect(
    view.root.findAllByProps({
      testID: 'blueprint-inspector-blueprint-application',
    }),
  ).toHaveLength(0);
  await act(async () =>
    view.root
      .findAllByProps({ accessibilityLabel: 'Open details drawer' })
      .find((node) => node.props.onPress)!
      .props.onPress(),
  );
  expect(
    view.root.findByProps({
      testID: 'blueprint-inspector-blueprint-application',
    }),
  ).toBeDefined();
  await press(view, 'blueprint-mode-all-screens');
  await act(async () =>
    view.root
      .findAllByProps({ accessibilityLabel: 'Collapse screens drawer' })
      .find((node) => node.props.onPress)!
      .props.onPress(),
  );
  expect(
    view.root.findAllByProps({ testID: 'blueprint-navigator' }),
  ).toHaveLength(0);
  await act(async () =>
    view.root
      .findAllByProps({ accessibilityLabel: 'Open screens drawer' })
      .find((node) => node.props.onPress)!
      .props.onPress(),
  );
  expect(
    view.root.findByProps({ testID: 'blueprint-navigator' }),
  ).toBeDefined();
  expect(events.filter((event) => event === 'mount:fixture-feed')).toHaveLength(
    1,
  );
  await act(async () => view.unmount());
});
