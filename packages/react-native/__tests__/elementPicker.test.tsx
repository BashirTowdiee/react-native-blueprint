/** @jest-environment jsdom */
import { attachBlueprintElementPicker, createInspectionStore, describeBlueprintElement } from '../src/inspection';

it('captures ordinary element clicks, blocks app actions, records parents and removes listeners on disable', () => {
  const root = document.createElement('div');
  root.innerHTML = '<div data-testid="blueprint-region-post"><button aria-label="Open thread"><span>Post</span></button></div>';
  const button = root.querySelector('button')!;
  const leaf = root.querySelector('span')!;
  const action = jest.fn();
  button.addEventListener('click', action);
  const store = createInspectionStore();
  const onSelect = jest.fn();
  const detach = attachBlueprintElementPicker(root, { store, artboardId: 'feed', onSelect });
  leaf.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  expect(action).not.toHaveBeenCalled();
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().selected).toMatchObject({
    artboardId: 'feed', componentId: 'post', element: { tag: 'span', childCount: 0 },
    ancestors: [{ tag: 'button', label: 'Open thread', childCount: 1 }, { tag: 'div', componentId: 'post' }],
  });
  detach();
  leaf.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(action).toHaveBeenCalledTimes(1);
});

it('bounds a wide and deep tree and omits text and input values', () => {
  const root = document.createElement('div');
  root.innerHTML = '<input type="password" value="private-value"><p>private-text</p>' + '<section>'.repeat(8) + '<div>'.repeat(30) + '</div>'.repeat(30) + '</section>'.repeat(8);
  const tree = describeBlueprintElement(root, root);
  const json = JSON.stringify(tree);
  expect(json).not.toContain('private');
  let count = 0;
  const visit = (node: typeof tree, depth: number) => {
    count++;
    expect(depth).toBeLessThanOrEqual(4);
    expect(node.children.length).toBeLessThanOrEqual(12);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  visit(tree, 0);
  expect(count).toBeLessThanOrEqual(60);
  expect(tree.children[0].tag).toBe('input');
});

it('highlights the same component selected from the drawer or its picked element and restores original styling', () => {
  const { highlightBlueprintSelection } = require('../src/inspection');
  const root = document.createElement('div');
  root.innerHTML = '<section data-testid="blueprint-region-settings"><button>Setting</button></section>';
  const region = root.querySelector('section')!;
  highlightBlueprintSelection(root);
  expect(root.querySelector('[data-blueprint-selected]')).toBeNull();
  const button = root.querySelector('button')!;
  region.style.outline = '1px solid red';
  const clearRegion = highlightBlueprintSelection(root, { artboardId: 'a', componentId: 'settings', origin: 'components' });
  expect(region.getAttribute('data-blueprint-selected')).toBe('true');
  clearRegion();
  expect(region.style.outline).toBe('1px solid red');
  expect(region.hasAttribute('data-blueprint-selected')).toBe(false);
  const element = describeBlueprintElement(button, root);
  const clearElement = highlightBlueprintSelection(root, { artboardId: 'a', componentId: 'settings', element, origin: 'canvas' });
  expect(button.getAttribute('data-blueprint-selected')).toBe('true');
  expect(region.hasAttribute('data-blueprint-selected')).toBe(false);
  clearElement();
  expect(button.hasAttribute('data-blueprint-selected')).toBe(false);
});

it('keeps hidden screen registrations while listing only visible regions, and follows screen changes', async () => {
  const { observeBlueprintVisibleComponents } = require('../src/inspection');
  jest.useFakeTimers();
  const root = document.createElement('div');
  root.innerHTML = '<section id="current" data-testid="blueprint-region-current"></section><section id="retained" hidden data-testid="blueprint-region-retained"></section>';
  root.querySelectorAll('section').forEach((node) => { node.getClientRects = () => node.hasAttribute('hidden') ? [] as any : [{}] as any; });
  const store = createInspectionStore();
  store.register('app', { id: 'current', name: 'Current' });
  store.register('app', { id: 'retained', name: 'Retained' });
  const cleanup = observeBlueprintVisibleComponents(root, store, 'app');
  try {
    expect(store.getSnapshot().visibleComponents?.app).toEqual(['current']);
    root.querySelector('#current')!.setAttribute('hidden', '');
    root.querySelector('#retained')!.removeAttribute('hidden');
    await Promise.resolve();
    jest.advanceTimersByTime(20);
    expect(store.getSnapshot().visibleComponents?.app).toEqual(['retained']);
    expect(Object.keys(store.getSnapshot().components.app)).toEqual(['current', 'retained']);
  } finally { cleanup(); jest.useRealTimers(); }
  expect(store.getSnapshot().visibleComponents?.app).toBeUndefined();
});

it('maps existing DOM labels without wrappers or compiler metadata and cleans up registrations', async () => {
  const { observeBlueprintVisibleComponents, highlightBlueprintSelection } = require('../src/inspection');
  jest.useFakeTimers();
  const root = document.createElement('div');
  root.innerHTML = '<button aria-label="Open settings"><span>Settings</span></button>';
  const button = root.querySelector('button')!;
  button.getClientRects = () => [{}] as any;
  const store = createInspectionStore();
  const stop = observeBlueprintVisibleComponents(root, store, 'app', { mappings: [{ id: 'settings', match: { accessibilityLabel: 'Open settings' }, name: 'Settings control', sourceLocation: { file: 'src/Settings.tsx', line: 5 } }] });
  try {
    const component = Object.values(store.getSnapshot().components.app)[0] as any;
    expect(component).toMatchObject({ name: 'Settings control', methods: ['config'], sourceLocation: { file: 'src/Settings.tsx', line: 5 } });
    expect(describeBlueprintElement(root.querySelector('span')!, root).componentId).toBe(component.id);
    const clear = highlightBlueprintSelection(root, { artboardId: 'app', componentId: component.id });
    expect(button.hasAttribute('data-blueprint-selected')).toBe(true);
    clear();
    button.remove(); await Promise.resolve(); jest.advanceTimersByTime(20);
    expect(store.getSnapshot().components.app).toEqual({});
  } finally { stop(); jest.useRealTimers(); }
});
