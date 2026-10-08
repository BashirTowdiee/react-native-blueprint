import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import {
  BlueprintNavigationFlow,
  BlueprintView,
  type BlueprintFlowNavigation,
  type BlueprintNavigationFlowConfig,
} from '../src';
import {
  layoutBlueprintHierarchy,
  flowConnectionPoints,
} from '../src/flowLayout';
import {
  routeFlowConnection,
  flowSegmentIntersectsBox,
} from '../src/flowRouting';

const route = (id: string) => ({ id, name: id });
beforeEach(() => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});
afterEach(() => {
  jest.restoreAllMocks();
});

function setup(mapped = true) {
  const events: string[] = [];
  function Screen({
    id,
    navigation,
  }: {
    id: string;
    navigation: BlueprintFlowNavigation;
  }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
      events.push(`mount:${id}`);
      return () => {
        events.push(`unmount:${id}`);
      };
    }, []);
    return (
      <View>
        <Text
          testID={`counter-${id}`}
          onPress={() => setCount((value) => value + 1)}
        >
          {count}
        </Text>
        <Text
          testID={`next-${id}`}
          onPress={() =>
            navigation.navigate(route(id === 'root' ? 'search' : 'detail'))
          }
        >
          Next
        </Text>
        <Text
          testID={`branch-${id}`}
          onPress={() => navigation.navigate(route('profile'))}
        >
          Profile
        </Text>
        <Text testID={`back-${id}`} onPress={navigation.goBack}>
          Back
        </Text>
      </View>
    );
  }
  const configuration: BlueprintNavigationFlowConfig = {
    initialRoute: route('root'),
    navigationMap: mapped
      ? {
          nodes: [
            { route: route('root') },
            { route: route('search'), parentId: 'root' },
            { route: route('profile'), parentId: 'root' },
            { route: route('detail'), parentId: 'search' },
          ],
        }
      : undefined,
    renderScreen: (route, navigation) => (
      <Screen id={route.id} navigation={navigation} />
    ),
  };
  return { configuration, events };
}
async function press(view: ReactTestRenderer, testID: string) {
  await act(async () => {
    view.root.findByProps({ testID }).props.onPress();
  });
}

it('renders placeholders without executing their screens, including when selected', async () => {
  const { configuration, events } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintNavigationFlow configuration={configuration} />,
    );
  });
  expect(events).toEqual(['mount:root']);
  expect(view.root.findByType(BlueprintView).props.artboards).toHaveLength(4);
  await press(view, 'blueprint-artboard-search-select');
  expect(events).toEqual(['mount:root']);
  expect(
    view.root.findAllByProps({ testID: 'blueprint-refresh-screen' }),
  ).toHaveLength(0);
  await act(async () => view.unmount());
});

it('mounts on navigation, requests focus and a pulse, and unmounts on back while retaining placeholders', async () => {
  const { configuration, events } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintNavigationFlow configuration={configuration} />,
    );
  });
  await press(view, 'counter-root');
  await press(view, 'next-root');
  expect(events).toEqual(['mount:root', 'mount:search']);
  expect(view.root.findByType(BlueprintView).props.focusRequest).toEqual({
    id: 'search',
    sequence: 1,
  });
  expect(
    view.root.findByProps({ testID: 'blueprint-flow-pulse' }),
  ).toBeDefined();
  await press(view, 'next-search');
  await press(view, 'back-detail');
  expect(events).toContain('unmount:detail');
  expect(
    view.root.findByProps({ testID: 'blueprint-flow-placeholder-detail' }),
  ).toBeDefined();
  expect(view.root.findByType(BlueprintView).props.focusRequest.id).toBe(
    'search',
  );
  expect(
    view.root.findByType(BlueprintView).props.navigationTransition,
  ).toMatchObject({ from: 'detail', to: 'search', kind: 'back' });
  expect(view.root.findByProps({ testID: 'counter-root' }).props.children).toBe(
    1,
  );
  await press(view, 'branch-root');
  expect(events).toContain('unmount:search');
  expect(events).toContain('mount:profile');
  expect(events.filter((event) => event === 'mount:root')).toHaveLength(1);
  await act(async () => view.unmount());
});

it('discovers paths without a map and lays sibling routes vertically at the same horizontal depth', async () => {
  const { configuration, events } = setup(false);
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintNavigationFlow configuration={configuration} />,
    );
  });
  expect(view.root.findByType(BlueprintView).props.artboards).toHaveLength(1);
  await press(view, 'next-root');
  await press(view, 'back-search');
  await press(view, 'branch-root');
  const search = view.root.findByProps({ testID: 'blueprint-position-search' })
    .props.style;
  const profile = view.root.findByProps({
    testID: 'blueprint-position-profile',
  }).props.style;
  const root = view.root.findByProps({ testID: 'blueprint-position-root' })
    .props.style;
  expect(search.left).toBe(profile.left);
  expect(search.top).not.toBe(profile.top);
  expect(search.left).toBeGreaterThan(root.left);
  expect(events).toContain('unmount:search');
  expect(
    view.root.findByProps({ testID: 'blueprint-flow-placeholder-search' }),
  ).toBeDefined();
  await act(async () => view.unmount());
});

it('restarts the flow and switching map policy starts a new discovery session', async () => {
  const { configuration, events } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintNavigationFlow configuration={configuration} />,
    );
  });
  await press(view, 'next-root');
  await press(view, 'blueprint-flow-restart');
  expect(events).toContain('unmount:search');
  expect(view.root.findByType(BlueprintView).props.focusRequest.id).toBe(
    'root',
  );
  await press(view, 'blueprint-flow-map-toggle');
  expect(view.root.findByType(BlueprintView).props.artboards).toHaveLength(1);
  expect(events.filter((event) => event === 'mount:root')).toHaveLength(3);
  await act(async () => view.unmount());
});

it('centers columns with mixed viewports and curves connections between their borders', () => {
  const boards = [
    {
      id: 'root',
      label: 'Root',
      content: null,
      viewport: { width: 390, height: 844 },
    },
    {
      id: 'a',
      label: 'A',
      content: null,
      parentArtboardId: 'root',
      viewport: { width: 768, height: 1024 },
    },
    {
      id: 'b',
      label: 'B',
      content: null,
      parentArtboardId: 'root',
      viewport: { width: 390, height: 844 },
    },
    { id: 'c', label: 'C', content: null, parentArtboardId: 'a' },
  ];
  const { boxes, width, height } = layoutBlueprintHierarchy(boards);
  expect(boxes.a.y + boxes.a.height).toBeLessThan(boxes.b.y);
  expect(boxes.root.x + boxes.root.width).toBeLessThan(boxes.a.x);
  expect(boxes.a.x + boxes.a.width).toBeLessThan(boxes.c.x);
  expect(boxes.root.y + boxes.root.height / 2).toBe(height / 2);
  expect(width).toBeGreaterThan(boxes.c.x + boxes.c.width);
  const points = flowConnectionPoints(boxes.root, boxes.a);
  expect(points[0].x).toBe(boxes.root.x + boxes.root.width - 10);
  expect(points[points.length - 1].x).toBe(boxes.a.x + 10);
  expect(new Set(points.map((point) => point.y)).size).toBeGreaterThan(2);
});

it('routes skipped levels and same-column paths around every screen frame', () => {
  const boards = [
    { id: 'root', label: 'Root', content: null },
    { id: 'a', label: 'A', content: null, parentArtboardId: 'root' },
    { id: 'b', label: 'B', content: null, parentArtboardId: 'root' },
    { id: 'c', label: 'C', content: null, parentArtboardId: 'a' },
  ];
  const { boxes } = layoutBlueprintHierarchy(boards);
  for (const [from, to] of [
    ['root', 'c'],
    ['a', 'b'],
    ['c', 'root'],
  ]) {
    const points = routeFlowConnection(
      boxes[from],
      boxes[to],
      Object.values(boxes),
    );
    expect(points.length).toBeGreaterThan(2);
    for (let index = 1; index < points.length; index++) {
      for (const box of Object.values(boxes))
        expect(
          flowSegmentIntersectsBox(points[index - 1], points[index], box),
        ).toBe(false);
    }
    expect(points[0].x).toBe(boxes[from].x + boxes[from].width - 10);
    expect(points[points.length - 1].x).toBe(boxes[to].x + 10);
  }
});

it('keeps the active line highlighted above other connectors after reduced-motion disables the pulse', async () => {
  const { configuration } = setup();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(
      <BlueprintNavigationFlow configuration={configuration} />,
    );
  });
  await press(view, 'next-root');
  expect(
    view.root.findByProps({ testID: 'blueprint-flow-active-link' }),
  ).toBeDefined();
  await press(view, 'back-search');
  expect(
    view.root.findByProps({ testID: 'blueprint-flow-active-link' }),
  ).toBeDefined();
  await act(async () => view.unmount());
});

it('captures the departing view before unmount, keeps its dimmed image and refreshes it on the next visit', async () => {
  const { configuration, events } = setup();
  let finish!: (uri: string) => void;
  const captureScreen = jest.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
  let view!: ReactTestRenderer;
  await act(async () => {
    view = renderer.create(<BlueprintNavigationFlow configuration={{ ...configuration, captureScreen }} />);
  });
  await press(view, 'next-root');
  await press(view, 'counter-search');
  await press(view, 'back-search');
  expect(captureScreen).toHaveBeenCalledTimes(1);
  expect(captureScreen.mock.calls[0][0]).toMatchObject({ id: 'search' });
  expect(events).not.toContain('unmount:search');
  await act(async () => finish('data:image/png;base64,first'));
  expect(events).toContain('unmount:search');
  const image = view.root.findByProps({ testID: 'blueprint-flow-snapshot-search' });
  expect(image.props.source.uri).toBe('data:image/png;base64,first');
  expect(image.props.style.opacity).toBeLessThan(1);
  expect(view.root.findAllByProps({ testID: 'counter-search' })).toHaveLength(0);
  await press(view, 'next-root');
  expect(view.root.findAllByProps({ testID: 'blueprint-flow-snapshot-search' })).toHaveLength(0);
  expect(view.root.findByProps({ testID: 'counter-search' }).props.children).toBe(0);
  await press(view, 'back-search');
  await act(async () => finish('data:image/png;base64,second'));
  expect(view.root.findByProps({ testID: 'blueprint-flow-snapshot-search' }).props.source.uri).toBe('data:image/png;base64,second');
  await act(async () => view.unmount());
});

it('still unmounts and keeps a placeholder when a capture integration fails', async () => {
  const { configuration, events } = setup();
  let view!: ReactTestRenderer;
  await act(async () => { view = renderer.create(<BlueprintNavigationFlow configuration={{ ...configuration, captureScreen: async () => { throw new Error('capture failed'); } }} />); });
  await press(view, 'next-root');
  await press(view, 'back-search');
  expect(events).toContain('unmount:search');
  expect(view.root.findByProps({ testID: 'blueprint-flow-placeholder-search' })).toBeDefined();
  await act(async () => view.unmount());
});

it('does not leave navigation waiting indefinitely for a capture', async () => {
  jest.useFakeTimers();
  const { configuration, events } = setup();
  let view: ReactTestRenderer | undefined;
  try {
    await act(async () => { view = renderer.create(<BlueprintNavigationFlow configuration={{ ...configuration, captureScreen: () => new Promise(() => {}) }} />); });
    await press(view!, 'next-root');
    await press(view!, 'back-search');
    expect(events).not.toContain('unmount:search');
    await act(async () => { jest.advanceTimersByTime(1500); });
    expect(events).toContain('unmount:search');
    expect(view!.root.findByProps({ testID: 'blueprint-flow-placeholder-search' })).toBeDefined();
  } finally {
    if (view) await act(async () => view!.unmount());
    jest.useRealTimers();
  }
});
