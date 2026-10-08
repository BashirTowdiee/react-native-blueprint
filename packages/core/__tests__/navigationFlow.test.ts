import {
  createBlueprintFlowState,
  navigateBlueprintFlow,
  backBlueprintFlow,
  type BlueprintFlowMap,
} from '../src';

const route = (id: string) => ({ id, name: id });
const map: BlueprintFlowMap = {
  nodes: [
    { route: route('root') },
    { route: route('search'), parentId: 'root' },
    { route: route('profile'), parentId: 'root' },
    { route: route('detail'), parentId: 'search' },
  ],
};

it('prelays out known nodes but only mounts the entry route', () => {
  const state = createBlueprintFlowState(route('root'), map);
  expect(state.nodes).toHaveLength(4);
  expect(state.stack).toEqual(['root']);
  expect(
    state.nodes.filter((node) => node.visited).map((node) => node.route.id),
  ).toEqual(['root']);
  expect(state.links).toContainEqual({ from: 'search', to: 'detail' });
});

it('pops mounted routes without removing placeholders or declared hierarchy', () => {
  let state = createBlueprintFlowState(route('root'), map);
  state = navigateBlueprintFlow(state, 'root', route('search'));
  state = navigateBlueprintFlow(state, 'search', route('detail'));
  expect(state.stack).toEqual(['root', 'search', 'detail']);
  const popped = backBlueprintFlow(state);
  expect(popped.stack).toEqual(['root', 'search']);
  expect(popped.nodes.find((node) => node.route.id === 'detail')).toMatchObject(
    { visited: true, parentId: 'search' },
  );
  expect(popped.transition).toEqual({
    from: 'detail',
    to: 'search',
    kind: 'back',
    sequence: 3,
  });
  expect(navigateBlueprintFlow(popped, 'detail', route('stale'))).toBe(popped);
});

it('discovers sibling paths and replaces an earlier branch without deleting its nodes', () => {
  let state = createBlueprintFlowState(route('root'));
  state = navigateBlueprintFlow(state, 'root', route('search'));
  state = navigateBlueprintFlow(state, 'search', route('detail'));
  state = navigateBlueprintFlow(state, 'root', route('profile'));
  expect(state.stack).toEqual(['root', 'profile']);
  expect(state.nodes).toHaveLength(4);
  expect(
    state.nodes.find((node) => node.route.id === 'profile')?.parentId,
  ).toBe('root');
  expect(state.nodes.find((node) => node.route.id === 'search')?.parentId).toBe(
    'root',
  );
  const back = navigateBlueprintFlow(state, 'profile', route('root'));
  expect(back.stack).toEqual(['root']);
  expect(back.links).not.toContainEqual({ from: 'profile', to: 'root' });
  expect(back.transition?.kind).toBe('back');
});

it('infers a finite hierarchy from graph links containing a navigation cycle', () => {
  const original = {
    nodes: [{ route: route('root') }, { route: route('search') }],
    links: [
      { from: 'root', to: 'search' },
      { from: 'search', to: 'root' },
    ],
  };
  const state = createBlueprintFlowState(route('root'), original);
  expect(state.nodes[1].parentId).toBe('root');
  expect(original.nodes[1]).not.toHaveProperty('parentId');
  const partial = createBlueprintFlowState(route('root'), {
    nodes: [
      { route: route('root') },
      { route: route('a'), parentId: 'b' },
      { route: route('b') },
    ],
    links: [
      { from: 'root', to: 'a' },
      { from: 'a', to: 'b' },
    ],
  });
  expect(
    partial.nodes.find((node) => node.route.id === 'b')?.parentId,
  ).toBeUndefined();
});

it('rejects duplicate routes, invalid references and cyclic explicit hierarchy', () => {
  expect(() =>
    createBlueprintFlowState(route('root'), {
      nodes: [{ route: route('x') }, { route: route('x') }],
    }),
  ).toThrow('Duplicate');
  expect(() =>
    createBlueprintFlowState(route('root'), {
      nodes: [{ route: route('x'), parentId: 'missing' }],
    }),
  ).toThrow('Unknown flow parent');
  expect(() =>
    createBlueprintFlowState(route('root'), {
      nodes: [
        { route: route('x'), parentId: 'y' },
        { route: route('y'), parentId: 'x' },
      ],
    }),
  ).toThrow('Cyclic');
});

it('updates route parameters without adding a duplicate node and keeps mapped dimensions', () => {
  const initial = createBlueprintFlowState(route('root'), {
    nodes: [
      {
        route: { ...route('search'), viewport: { width: 430, height: 932 } },
        parentId: 'root',
      },
    ],
  });
  const entered = navigateBlueprintFlow(initial, 'root', {
    ...route('search'),
    params: { id: 1 },
  });
  const updated = navigateBlueprintFlow(entered, 'search', {
    ...route('search'),
    params: { id: 2 },
  });
  expect(updated.nodes).toHaveLength(2);
  expect(
    updated.nodes.find((node) => node.route.id === 'search')?.route,
  ).toMatchObject({ params: { id: 2 }, viewport: { width: 430, height: 932 } });
});
