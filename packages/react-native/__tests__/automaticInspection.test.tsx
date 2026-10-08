import React from 'react';
import { View, Text, Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { BlueprintSourceElement, BlueprintInspectionConfigurationProvider, BlueprintInspectionProvider, createInspectionStore } from '../src/inspection';
import { matchBlueprintInspectionMapping } from '../src/inspectionSources';
const metadata = { name: 'Profile', host: 'View', location: { file: 'src/Profile.tsx', line: 13, column: 3 } };

it('registers compiler metadata, config overrides and nesting without adding host views', () => {
  const store = createInspectionStore();
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => { tree = TestRenderer.create(<BlueprintInspectionConfigurationProvider value={{ mappings: [{ id: 'profile', match: { testID: 'profile' }, name: 'Public profile', data: { token: 'secret', count: 2 } }] }}><BlueprintInspectionProvider store={store} artboardId="app" inspecting={false} viewport={{ width: 390, height: 844 }} onSelect={() => {}}>
    <BlueprintSourceElement blueprintHost={View} blueprintSource={metadata} testID="profile"><BlueprintSourceElement blueprintHost={Text} blueprintSource={{ ...metadata, host: 'Text' }}>Hello</BlueprintSourceElement></BlueprintSourceElement>
  </BlueprintInspectionProvider></BlueprintInspectionConfigurationProvider>); });
  const components = Object.values(store.getSnapshot().components.app);
  const parent = components.find((c) => c.name === 'Public profile')!;
  expect(parent.methods).toEqual(['automatic', 'config']);
  expect(parent.sourceLocation).toEqual(metadata.location);
  expect(parent.data).not.toContain('secret');
  expect(components.find((c) => c.name === 'Profile · Text')?.parentId).toBe(parent.id);
  expect(tree.root.findAllByType(View)).toHaveLength(1);
  expect(tree.root.findByType(View).props.testID).toBe('profile');
  act(() => tree.unmount());
  expect(store.getSnapshot().components.app).toEqual({});
});

it('passes callback and object refs to the original host and preserves web datasets', () => {
  const store = createInspectionStore();
  const ref = React.createRef<any>();
  const node = { measureInWindow() {} };
  const platform = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => { tree = TestRenderer.create(<BlueprintInspectionProvider store={store} artboardId="app" inspecting={false} viewport={{ width: 390, height: 844 }} onSelect={() => {}}><BlueprintSourceElement ref={ref} blueprintHost={View} blueprintSource={metadata} dataSet={{ existing: 'value' }} /></BlueprintInspectionProvider>, { createNodeMock: () => node }); });
  expect(ref.current === tree.root.findByType(View).instance).toBe(true);
  expect(tree.root.findByType(View).props.dataSet).toMatchObject({ existing: 'value', blueprintId: expect.any(String) });
  act(() => tree.unmount());
  expect(ref.current).toBeNull();
  Object.defineProperty(Platform, 'OS', { value: platform, configurable: true });
});

it('can disable automatic registration while keeping matched config elements', () => {
  const store = createInspectionStore();
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => { tree = TestRenderer.create(<BlueprintInspectionConfigurationProvider value={{ automatic: false }}><BlueprintInspectionProvider store={store} artboardId="app" inspecting={false} viewport={{ width: 390, height: 844 }} onSelect={() => {}}><BlueprintSourceElement blueprintHost={View} blueprintSource={metadata} /></BlueprintInspectionProvider></BlueprintInspectionConfigurationProvider>); });
  expect(store.getSnapshot().components.app).toBeUndefined();
  act(() => tree.unmount());
  expect(matchBlueprintInspectionMapping([{ id: 'a', match: {}, name: 'Bad' }, { id: 'b', match: { accessibilityLabel: { prefix: 'Open ' }, host: 'View' }, name: 'Good' }], metadata, { accessibilityLabel: 'Open thread post-1' })?.id).toBe('b');
});

it('resolves a screen usage separately from a shared implementation without extra host views or lost refs', () => {
  const { withBlueprintSourceUsage, resolveBlueprintComponentSources, resolveBlueprintRenderTarget } = require('../src/inspection');
  const store = createInspectionStore();
  const ref = React.createRef<any>();
  const usage = { component: 'Shared', owner: 'Home', scope: 'application', location: { file: 'src/Home.tsx', line: 12 } };
  const shared = { component: 'Text', owner: 'Shared', scope: 'component', location: { file: 'src/ui/Shared.tsx', line: 7 } };
  const Shared = React.forwardRef<any>((props, forwarded) => withBlueprintSourceUsage(<BlueprintSourceElement ref={forwarded} blueprintHost={Text} blueprintSource={metadata}>Label</BlueprintSourceElement>, shared));
  const element = <Shared key="stable" ref={ref} />;
  const wrapped = withBlueprintSourceUsage(element, usage);
  expect(wrapped.key).toBe(element.key);
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => { tree = TestRenderer.create(<BlueprintInspectionProvider store={store} artboardId="app" inspecting={false} viewport={{width:390,height:844}} onSelect={() => {}}>{wrapped}</BlueprintInspectionProvider>, { createNodeMock: () => ({ measureInWindow() {} }) }); });
  const components = store.getSnapshot().components.app;
  const host = Object.values(components).find((c: any) => c.sourceKind === 'definition')!;
  const sources = resolveBlueprintComponentSources(components, host.id);
  expect(sources.usage.location).toEqual(usage.location);
  expect(sources.definition.location).toEqual(metadata.location);
  expect(resolveBlueprintRenderTarget(components, sources.usage.component.id)).toBe(host.id);
  expect(tree.root.findAllByType(Text)).toHaveLength(1);
  expect(ref.current).toBeTruthy();
  act(() => tree.unmount());
  expect(ref.current).toBeNull();
  expect(store.getSnapshot().components.app).toEqual({});
});
