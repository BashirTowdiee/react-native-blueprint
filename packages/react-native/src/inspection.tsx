import React, {
  createContext,
  forwardRef,
  useState,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  useCallback,
} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { BlueprintViewport } from '@react-native-blueprint/core';
import {
  serializeBlueprintData,
  compareBlueprintSnapshots,
  type BlueprintValueChange,
} from './dataTools';
export { serializeBlueprintData } from './dataTools';
import { matchBlueprintInspectionMapping, type BlueprintElementMetadata, type BlueprintInspectionConfiguration, type BlueprintInspectionMethod } from './inspectionSources';
export type { BlueprintInspectionConfiguration, BlueprintInspectionMapping, BlueprintInspectionMethod, BlueprintDevToolsConnection, BlueprintDevToolsStatus } from './inspectionSources';
const ConfigurationContext = createContext<BlueprintInspectionConfiguration | undefined>(undefined);
export const BlueprintInspectionConfigurationProvider = ConfigurationContext.Provider;


export type BlueprintSourceLocation = { file: string; line?: number; column?: number };
export type BlueprintRenderedElement = {
  tag: string; role?: string; label?: string; componentId?: string;
  children: readonly BlueprintRenderedElement[]; childCount: number;
};
export type BlueprintComponentData = {
  id: string;
  name: string;
  source?: string;
  sourceLocation?: BlueprintSourceLocation;
  parentId?: string;
  data?: unknown;
  methods?: readonly BlueprintInspectionMethod[];
  mappingId?: string;
};
export function resolveBlueprintComponentSource(components: Record<string, BlueprintComponentData>, id?: string) {
  const seen = new Set<string>();
  let component = id ? components[id] : undefined;
  while (component && !seen.has(component.id)) {
    seen.add(component.id);
    const location = component.sourceLocation ?? (component.source ? { file: component.source.split('#')[0] } : undefined);
    if (location?.file) return { component, location };
    component = component.parentId ? components[component.parentId] : undefined;
  }
  return undefined;
}

export type BlueprintRenderMetrics = {
  commits: number;
  lastDuration: number;
  totalDuration: number;
  lastCommit: number;
  refreshes: number;
};
export type BlueprintInspectionEvent = {
  id: number;
  kind: 'data' | 'refresh';
  at: number;
  componentId?: string;
  componentName?: string;
  changes: readonly BlueprintValueChange[];
  truncated: boolean;
};
export type BlueprintSelectionOrigin = 'canvas' | 'components' | 'tree';
export type InspectionSnapshot = {
  components: Record<string, Record<string, BlueprintComponentData>>;
  metrics: Record<string, BlueprintRenderMetrics>;
  history: Record<string, readonly BlueprintInspectionEvent[]>;
  visibleComponents?: Record<string, readonly string[]>;
  selected?: { artboardId: string; componentId?: string; element?: BlueprintRenderedElement; ancestors?: readonly BlueprintRenderedElement[]; origin?: BlueprintSelectionOrigin };
};

export function createInspectionStore() {
  let snapshot: InspectionSnapshot = {
    components: {},
    metrics: {},
    history: {},
  };
  let eventId = 0;
  const record = (
    artboardId: string,
    event: Omit<BlueprintInspectionEvent, 'id' | 'at'>,
  ) => {
    snapshot = {
      ...snapshot,
      history: {
        ...snapshot.history,
        [artboardId]: [
          { ...event, id: ++eventId, at: Date.now() },
          ...(snapshot.history[artboardId] ?? []),
        ].slice(0, 30),
      },
    };
  };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  let metricsPending = false;
  const emitMetrics = () => {
    if (metricsPending) return;
    metricsPending = true;
    // Subscribers are outside the profiled tree. Do not schedule updates inside
    // React's commit callback: that would add nested measurement overhead.
    queueMicrotask(() => {
      metricsPending = false;
      emit();
    });
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    register(artboardId: string, component: BlueprintComponentData) {
      const previous = snapshot.components[artboardId]?.[component.id];
      if (previous && previous.data !== component.data) {
        const diff = compareBlueprintSnapshots(
          String(previous.data ?? 'null'),
          String(component.data ?? 'null'),
        );
        if (diff.changes.length || diff.truncated)
          record(artboardId, {
            kind: 'data',
            componentId: component.id,
            componentName: component.name,
            changes: diff.changes.slice(0, 20),
            truncated: diff.truncated || diff.changes.length > 20,
          });
      }
      snapshot = {
        ...snapshot,
        components: {
          ...snapshot.components,
          [artboardId]: {
            ...snapshot.components[artboardId],
            [component.id]: component,
          },
        },
      };
      emit();
    },
    remove(artboardId: string, componentId: string) {
      const components = { ...snapshot.components[artboardId] };
      delete components[componentId];
      snapshot = {
        ...snapshot,
        components: { ...snapshot.components, [artboardId]: components },
        selected:
          snapshot.selected?.artboardId === artboardId &&
          snapshot.selected.componentId === componentId
            ? undefined
            : snapshot.selected,
      };
      emit();
    },
    select(artboardId: string, componentId: string, origin: BlueprintSelectionOrigin = 'components') {
      snapshot = { ...snapshot, selected: { artboardId, componentId, origin } };
      emit();
    },
    selectElement(artboardId: string, element: BlueprintRenderedElement, ancestors: readonly BlueprintRenderedElement[] = [], origin: BlueprintSelectionOrigin = 'canvas') {
      snapshot = { ...snapshot, selected: { artboardId, componentId: element.componentId, element, ancestors, origin } };
      emit();
    },
    setVisibleComponents(artboardId: string, ids?: readonly string[]) {
      const previous = snapshot.visibleComponents?.[artboardId];
      if (previous === ids || (previous && ids && previous.length === ids.length && previous.every((id, index) => id === ids[index]))) return;
      const visibleComponents = { ...snapshot.visibleComponents };
      if (ids) visibleComponents[artboardId] = ids;
      else delete visibleComponents[artboardId];
      snapshot = { ...snapshot, visibleComponents };
      emit();
    },
    clearSelection(artboardId: string) {
      if (snapshot.selected?.artboardId !== artboardId) return;
      snapshot = { ...snapshot, selected: undefined };
      emit();
    },
    commit(artboardId: string, duration: number, time: number) {
      const previous = snapshot.metrics[artboardId];
      if (previous?.commits && previous.lastCommit === time) return;
      snapshot = {
        ...snapshot,
        metrics: {
          ...snapshot.metrics,
          [artboardId]: {
            commits: (previous?.commits ?? 0) + 1,
            lastDuration: duration,
            totalDuration: (previous?.totalDuration ?? 0) + duration,
            lastCommit: time,
            refreshes: previous?.refreshes ?? 0,
          },
        },
      };
      emitMetrics();
    },
    clearHistory(artboardId: string) {
      snapshot = {
        ...snapshot,
        history: { ...snapshot.history, [artboardId]: [] },
      };
      emit();
    },
    refresh(artboardId: string) {
      record(artboardId, { kind: 'refresh', changes: [], truncated: false });
      const previous = snapshot.metrics[artboardId];
      snapshot = {
        ...snapshot,
        metrics: {
          ...snapshot.metrics,
          [artboardId]: {
            commits: 0,
            lastDuration: 0,
            totalDuration: 0,
            lastCommit: 0,
            refreshes: (previous?.refreshes ?? 0) + 1,
          },
        },
      };
      emit();
    },
  };
}
export type InspectionStore = ReturnType<typeof createInspectionStore>;
const ParentComponent = createContext<string | undefined>(undefined);
const InspectionContext = createContext<{
  store: InspectionStore;
  artboardId: string;
  inspecting: boolean;
  viewport: BlueprintViewport;
  onSelect(): void;
  configuration?: BlueprintInspectionConfiguration;
  nativeTargets: Map<string, { measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void }>;
} | null>(null);
export function useInspectionSnapshot(store: InspectionStore) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
export function BlueprintInspectionProvider({
  store,
  artboardId,
  inspecting,
  viewport,
  onSelect,
  children,
}: {
  store: InspectionStore;
  artboardId: string;
  inspecting: boolean;
  viewport: BlueprintViewport;
  onSelect(): void;
  children: ReactNode;
}) {
  const configuration = useContext(ConfigurationContext);
  const nativeTargets = useRef(new Map()).current;
  useEffect(() => () => store.clearSelection(artboardId), [store, artboardId]);
  const context = useMemo(
    () => ({ store, artboardId, inspecting, viewport, onSelect, configuration, nativeTargets }),
    [store, artboardId, inspecting, viewport, onSelect, configuration, nativeTargets],
  );
  return (
    <InspectionContext.Provider value={context}>
      {children}
    </InspectionContext.Provider>
  );
}

/** Artboard dimensions for app-owned preview adapters; undefined outside Blueprint. */
export function useBlueprintPreviewViewport(): BlueprintViewport | undefined {
  return useContext(InspectionContext)?.viewport;
}

/** Opt-in region: no dependency on private Fiber fields, arbitrary hooks or native internals. */
export function BlueprintInspectable({
  name,
  id,
  source,
  sourceLocation,
  pickable = true,
  data,
  children,
  style,
}: {
  name: string;
  id?: string;
  source?: string;
  sourceLocation?: BlueprintSourceLocation;
  pickable?: boolean;
  data?: unknown;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const context = useContext(InspectionContext);
  const parentId = useContext(ParentComponent);
  const generatedId = useId();
  const componentId = id ?? generatedId;
  const serialized = context ? serializeBlueprintData(data) : '';
  const store = context?.store;
  const artboardId = context?.artboardId;
  const getSelected = useCallback(() => {
    const selection = store?.getSnapshot().selected;
    return selection?.artboardId === artboardId && selection?.componentId === componentId;
  }, [store, artboardId, componentId]);
  const selected = useSyncExternalStore(store?.subscribe ?? (() => () => {}), getSelected, getSelected);
  useEffect(() => {
    if (!store || !artboardId) return;
    store.register(artboardId, {
      id: componentId,
      name,
      source,
      sourceLocation,
      parentId,
      data: serialized,
      methods: ['wrapper'],
    });
  }, [store, artboardId, componentId, name, source, sourceLocation?.file, sourceLocation?.line, sourceLocation?.column, parentId, serialized]);
  useEffect(
    () => () => {
      if (store && artboardId) store.remove(artboardId, componentId);
    },
    [store, artboardId, componentId],
  );
  if (!context)
    return style ? <View style={style}>{children}</View> : <>{children}</>;
  return (
    <View style={style} testID={`blueprint-region-${componentId}`}>
      <ParentComponent.Provider value={componentId}>{children}</ParentComponent.Provider>
      {selected && Platform.OS !== 'web' ? <View pointerEvents="none" testID={`blueprint-selected-${componentId}`} style={[StyleSheet.absoluteFillObject, { borderWidth: 2, borderColor: '#4dd9b4' }]} /> : null}
      {context.inspecting && pickable && Platform.OS !== 'web' ? (
        <Pressable
          testID={`blueprint-pick-${componentId}`}
          accessibilityRole="button"
          accessibilityLabel={`Inspect ${name}`}
          style={styles.target}
          onPress={() => {
            store!.select(artboardId!, componentId, 'canvas');
            context.onSelect();
          }}
        />
      ) : null}
    </View>
  );
}

/** Generated by the Babel plugin; adds no host view and passes original props/refs through. */
export const BlueprintSourceElement = forwardRef<any, {
  blueprintHost: React.ElementType;
  blueprintSource: BlueprintElementMetadata;
  children?: ReactNode;
  [key: string]: any;
}>(function BlueprintSourceElement({ blueprintHost: Host, blueprintSource: metadata, ...props }, forwardedRef) {
  const context = useContext(InspectionContext);
  const parentId = useContext(ParentComponent);
  const id = `auto-${useId()}`;
  const mapping = matchBlueprintInspectionMapping(context?.configuration?.mappings, metadata, props);
  const enabled = !!context && (context.configuration?.automatic !== false || !!mapping);
  const location = mapping?.sourceLocation ?? metadata.location;
  // Public, bounded host metadata; input values and callback closures are omitted.
  const data = serializeBlueprintData(mapping?.data ?? {
    host: metadata.host, testID: props.testID, role: props.accessibilityRole,
    label: props.accessibilityLabel, state: props.accessibilityState,
    disabled: props.disabled,
  });
  useEffect(() => {
    if (!enabled || !context) return;
    context.store.register(context.artboardId, {
      id, name: mapping?.name ?? `${metadata.name} · ${metadata.host}`,
      sourceLocation: location, parentId, data,
      methods: mapping ? context.configuration?.automatic === false ? ['config'] : ['automatic', 'config'] : ['automatic'], mappingId: mapping?.id,
    });
  }, [context?.store, context?.artboardId, enabled, id, metadata.name, metadata.host, location.file, location.line, location.column, parentId, mapping?.id, mapping?.name, data]);
  useEffect(() => () => { if (context && enabled) context.store.remove(context.artboardId, id); }, [context?.store, context?.artboardId, enabled, id]);
  const hostRef = useCallback((node: any) => {
    if (node?.measureInWindow && context && enabled) context.nativeTargets.set(id, node);
    else context?.nativeTargets.delete(id);
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [context?.nativeTargets, enabled, id, forwardedRef]);
  const host = <Host {...props} ref={hostRef} {...(enabled && Platform.OS === 'web' ? { dataSet: { ...props.dataSet, blueprintId: id } } : {})} />;
  return enabled ? <ParentComponent.Provider value={id}>{host}</ParentComponent.Provider> : host;
});

const configuredNodes = new WeakMap<Element, string>();
let configuredNodeSequence = 0;
const renderedNodes = new WeakMap<BlueprintRenderedElement, Element>();
export function highlightBlueprintSelection(root: HTMLElement, selection?: InspectionSnapshot['selected']) {
  if (!selection?.componentId && !selection?.element) return () => {};
  const rendered = selection?.element && renderedNodes.get(selection.element);
  const node = rendered && root.contains(rendered) ? rendered :
    Array.from(root.querySelectorAll('[data-testid^="blueprint-region-"], [data-blueprint-id], [data-testid], [aria-label]')).find((element) => (configuredNodes.get(element) ?? element.getAttribute('data-blueprint-id') ?? (element.getAttribute('data-testid')?.startsWith('blueprint-region-') ? element.getAttribute('data-testid')?.slice('blueprint-region-'.length) : undefined)) === selection?.componentId);
  if (!(node instanceof HTMLElement)) return () => {};
  const previous = { outline: node.style.outline, offset: node.style.outlineOffset };
  node.style.outline = '2px solid #4dd9b4';
  node.style.outlineOffset = '-2px';
  node.setAttribute('data-blueprint-selected', 'true');
  return () => {
    node.style.outline = previous.outline;
    node.style.outlineOffset = previous.offset;
    node.removeAttribute('data-blueprint-selected');
  };
}

/** Bounded host-element tree: no private React fields, input values or DOM text snapshots. */
export function describeBlueprintElement(element: Element, root: Element): BlueprintRenderedElement {
  let remaining = 60;
  const describe = (node: Element, depth: number): BlueprintRenderedElement => {
    remaining -= 1;
    let owner: Element | null = node;
    while (owner && root.contains(owner) && !configuredNodes.has(owner) && !owner.hasAttribute('data-blueprint-id') && !owner.getAttribute('data-testid')?.startsWith('blueprint-region-')) owner = owner.parentElement;
    const description: BlueprintRenderedElement = {
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute('role') ?? undefined,
      label: node.getAttribute('aria-label')?.slice(0, 160) ?? undefined,
      componentId: owner && root.contains(owner) ? (configuredNodes.get(owner) ?? owner.getAttribute('data-blueprint-id') ?? owner.getAttribute('data-testid')?.slice('blueprint-region-'.length)) : undefined,
      childCount: node.children.length,
      children: depth < 4 ? Array.from(node.children).slice(0, 12).flatMap((child) => remaining > 0 ? [describe(child, depth + 1)] : []) : [],
    };
    renderedNodes.set(description, node);
    return description;
  };
  return describe(element, 0);
}

export function attachBlueprintElementPicker(root: HTMLElement, context: {
  store: InspectionStore; artboardId: string; onSelect(): void;
}) {
  let highlighted: HTMLElement | undefined;
  let previousOutline = '';
  let previousOffset = '';
  let previousCursor = '';
  const clearHighlight = () => {
    if (!highlighted) return;
    if (!highlighted.hasAttribute('data-blueprint-selected')) {
      highlighted.style.outline = previousOutline;
      highlighted.style.outlineOffset = previousOffset;
    }
    highlighted.style.cursor = previousCursor;
    highlighted = undefined;
  };
  const hover = (event: Event) => {
    if (!(event.target instanceof HTMLElement) || event.target === highlighted) return;
    if (event.target.hasAttribute('data-blueprint-selected')) { clearHighlight(); return; }
    clearHighlight();
    highlighted = event.target;
    previousOutline = highlighted.style.outline;
    previousOffset = highlighted.style.outlineOffset;
    previousCursor = highlighted.style.cursor;
    highlighted.style.outline = '2px solid #4dd9b4';
    highlighted.style.outlineOffset = '-2px';
    highlighted.style.cursor = 'crosshair';
  };
  const blockPress = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
  const pick = (event: Event) => {
    blockPress(event);
    const element = event.target;
    if (!(element instanceof Element) || !root.contains(element)) return;
    const ancestors: BlueprintRenderedElement[] = [];
    let parent = element.parentElement;
    while (parent && root.contains(parent) && parent !== root && ancestors.length < 4) {
      ancestors.push(describeBlueprintElement(parent, root));
      parent = parent.parentElement;
    }
    clearHighlight();
    context.store.selectElement(context.artboardId, describeBlueprintElement(element, root), ancestors);
    context.onSelect();
  };
  root.addEventListener('pointermove', hover, true);
  root.addEventListener('pointerleave', clearHighlight);
  root.addEventListener('pointerdown', blockPress, true);
  root.addEventListener('click', pick, true);
  return () => {
    clearHighlight();
    root.removeEventListener('pointermove', hover, true);
    root.removeEventListener('pointerleave', clearHighlight);
    root.removeEventListener('pointerdown', blockPress, true);
    root.removeEventListener('click', pick, true);
  };
}

export function observeBlueprintVisibleComponents(root: HTMLElement, store: InspectionStore, artboardId: string, configuration?: BlueprintInspectionConfiguration) {
  const window = root.ownerDocument.defaultView;
  if (!window) return () => {};
  let scheduled = 0;
  const registered = new Map<string, string>();
  const measure = () => {
    scheduled = 0;
    const configuredVisible: string[] = [];
    const currentIds = new Set<string>();
    if (configuration?.mappings?.length) Array.from(root.querySelectorAll('[data-testid], [aria-label]')).slice(0, 2000).forEach((node) => {
      if (node.hasAttribute('data-blueprint-id') || node.getAttribute('data-testid')?.startsWith('blueprint-region-')) return;
      const mapping = matchBlueprintInspectionMapping(configuration.mappings, { name: '', host: node.tagName.toLowerCase(), location: { file: '' } }, {
        testID: node.getAttribute('data-testid') ?? undefined, accessibilityLabel: node.getAttribute('aria-label') ?? undefined,
      });
      if (!mapping) { configuredNodes.delete(node); return; }
      const id = configuredNodes.get(node) ?? `config-${++configuredNodeSequence}`;
      configuredNodes.set(node, id);
      currentIds.add(id);
      const component = { id, name: mapping.name, sourceLocation: mapping.sourceLocation, data: serializeBlueprintData(mapping.data ?? { tag: node.tagName.toLowerCase(), role: node.getAttribute('role') ?? undefined, label: node.getAttribute('aria-label') ?? undefined }), methods: ['config'] as const, mappingId: mapping.id };
      const signature = JSON.stringify(component);
      if (registered.get(id) !== signature) { store.register(artboardId, component); registered.set(id, signature); }
      if (node.getClientRects().length > 0) configuredVisible.push(id);
    });
    for (const id of registered.keys()) if (!currentIds.has(id)) { store.remove(artboardId, id); registered.delete(id); }
    store.setVisibleComponents(artboardId, Array.from(root.querySelectorAll('[data-testid^="blueprint-region-"], [data-blueprint-id]'))
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => (element.getAttribute('data-blueprint-id') ?? element.getAttribute('data-testid')!.slice('blueprint-region-'.length))).concat(configuredVisible));
  };
  const schedule = () => { if (!scheduled) scheduled = window.requestAnimationFrame(measure); };
  const observer = new window.MutationObserver(schedule);
  observer.observe(root, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class', 'hidden', 'aria-label', 'data-testid'] });
  measure();
  return () => {
    observer.disconnect();
    if (scheduled) window.cancelAnimationFrame(scheduled);
    store.setVisibleComponents(artboardId);
    for (const node of Array.from(root.querySelectorAll('[data-testid], [aria-label]'))) if (registered.has(configuredNodes.get(node) ?? '')) configuredNodes.delete(node);
    for (const id of registered.keys()) store.remove(artboardId, id);
  };
}

export function BlueprintElementPicker({ children }: { children: ReactNode }) {
  const context = useContext(InspectionContext);
  const ref = useRef<View>(null);
  const getSelection = useCallback(() => context?.store.getSnapshot().selected, [context?.store]);
  const subscribe = context?.store.subscribe ?? (() => () => {});
  const selection = useSyncExternalStore(subscribe, getSelection, getSelection);
  const getIds = useCallback(() => Object.keys(context?.store.getSnapshot().components[context.artboardId] ?? {}).join('|'), [context?.store, context?.artboardId]);
  const ids = useSyncExternalStore(subscribe, getIds, getIds);
  const [bounds, setBounds] = useState<{ id: string; x: number; y: number; width: number; height: number }[]>([]);
  const [origin, setOrigin] = useState({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
  useEffect(() => {
    if (Platform.OS === 'web' || !context || (!context.inspecting && !selection)) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => { if (!cancelled) setOrigin({ x, y, scaleX: width / context.viewport.width || 1, scaleY: height / context.viewport.height || 1 }); });
      const targets = Array.from(context.nativeTargets);
      const measured: typeof bounds = [];
      targets.forEach(([id, node]) => node.measureInWindow((x, y, width, height) => {
        if (cancelled) return;
        if (width > 0 && height > 0) measured.push({ id, x, y, width, height });
        setBounds([...measured]);
      }));
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [context?.inspecting, context?.nativeTargets, ids, selection]);
  const selectedBounds = selection?.artboardId === context?.artboardId ? bounds.find((box) => box.id === selection?.componentId) : undefined;
  useEffect(() => {
    if (Platform.OS !== 'web' || !context) return;
    const root = ref.current as unknown as HTMLElement | null;
    if (!root?.ownerDocument) return;
    return observeBlueprintVisibleComponents(root, context.store, context.artboardId, context.configuration);
  }, [context?.store, context?.artboardId, context?.configuration]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !context) return;
    const root = ref.current as unknown as HTMLElement | null;
    if (!root?.querySelectorAll) return;
    return highlightBlueprintSelection(root, selection?.artboardId === context.artboardId ? selection : undefined);
  }, [selection, context?.artboardId, context?.inspecting]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !context?.inspecting) return;
    const root = ref.current as unknown as HTMLElement | null;
    if (!root?.addEventListener) return;
    return attachBlueprintElementPicker(root, context);
  }, [context]);
  return <View ref={ref} style={{ flex: 1 }} testID="blueprint-element-picker">
    {children}
    {Platform.OS !== 'web' && selectedBounds ? <View pointerEvents="none" style={{ position: 'absolute', left: (selectedBounds.x - origin.x) / origin.scaleX, top: (selectedBounds.y - origin.y) / origin.scaleY, width: selectedBounds.width / origin.scaleX, height: selectedBounds.height / origin.scaleY, borderWidth: 2, borderColor: '#4dd9b4' }} /> : null}
    {Platform.OS !== 'web' && context?.inspecting && bounds.length ? <Pressable accessibilityLabel="Pick preview element" style={StyleSheet.absoluteFillObject} onPress={(event) => {
      const { pageX, pageY } = event.nativeEvent;
      const hit = bounds.filter((box) => pageX >= box.x && pageX <= box.x + box.width && pageY >= box.y && pageY <= box.y + box.height).sort((a, b) => a.width * a.height - b.width * b.height)[0];
      if (hit) { context.store.select(context.artboardId, hit.id, 'canvas'); context.onSelect(); }
    }} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  target: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#4dd9b4',
    backgroundColor: 'rgba(77,217,180,0.08)',
  },
});
