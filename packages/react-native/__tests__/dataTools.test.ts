import { compareBlueprintSnapshots, serializeBlueprintData } from '../src';
import { createInspectionStore } from '../src/inspection';

it('compares nested values, additions/removals and escaped JSON Pointer paths', () => {
  const before = serializeBlueprintData({
    post: { likes: 24, liked: false },
    old: null,
    'a/b~c': 1,
  });
  const after = serializeBlueprintData({
    post: { likes: 25, liked: true },
    added: null,
    'a/b~c': 2,
  });
  const result = compareBlueprintSnapshots(before, after);
  expect(result.changes).toEqual(
    expect.arrayContaining([
      { path: '/post/likes', kind: 'changed', before: '24', after: '25' },
      { path: '/post/liked', kind: 'changed', before: 'false', after: 'true' },
      { path: '/added', kind: 'added', before: '[missing]', after: 'null' },
      { path: '/old', kind: 'removed', before: 'null', after: '[missing]' },
      { path: '/a~1b~0c', kind: 'changed', before: '1', after: '2' },
    ]),
  );
  expect(result.truncated).toBe(false);
});

it('handles arrays, equal objects in a different key order, primitives and bounded output', () => {
  expect(
    compareBlueprintSnapshots('{"a":1,"b":2}', '{"b":2,"a":1}').changes,
  ).toEqual([]);
  expect(
    compareBlueprintSnapshots('[1,2]', '[1,3,4]').changes.map((c) => c.path),
  ).toEqual(['/1', '/2']);
  expect(compareBlueprintSnapshots('null', '1').changes).toEqual([
    { path: '', kind: 'changed', before: 'null', after: '1' },
  ]);
  const values = Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => [`field${i}`, i]),
  );
  const changed = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value + 1]),
  );
  const result = compareBlueprintSnapshots(
    JSON.stringify(values),
    JSON.stringify(changed),
  );
  expect(result.changes).toHaveLength(50);
  expect(result.truncated).toBe(true);
  const long = compareBlueprintSnapshots(
    JSON.stringify('x'.repeat(1000)),
    JSON.stringify('y'.repeat(1000)),
  );
  expect(long.changes[0].after.length).toBeLessThan(300);
});

it('records real exposed changes, keeps bounded history and clears it independently', () => {
  const store = createInspectionStore();
  const register = (likes: number, secret: string) =>
    store.register('feed', {
      id: 'post',
      name: 'PostCard',
      data: serializeBlueprintData({ likes, password: secret }),
    });
  register(0, 'private-one');
  register(0, 'private-two');
  expect(store.getSnapshot().history.feed).toBeUndefined();
  for (let i = 1; i <= 35; i++) register(i, 'private-three');
  expect(store.getSnapshot().history.feed).toHaveLength(30);
  const recent = store.getSnapshot().history.feed[0];
  expect(recent.changes).toEqual([
    { path: '/likes', kind: 'changed', before: '34', after: '35' },
  ]);
  expect(JSON.stringify(store.getSnapshot().history)).not.toContain('private');
  store.refresh('feed');
  expect(store.getSnapshot().history.feed[0].kind).toBe('refresh');
  store.clearHistory('feed');
  expect(store.getSnapshot().history.feed).toEqual([]);
  expect(store.getSnapshot().components.feed.post).toBeDefined();
  expect(store.getSnapshot().metrics.feed.refreshes).toBe(1);
});
