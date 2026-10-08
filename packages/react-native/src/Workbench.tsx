import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { InspectionHistory, SnapshotComparison } from './InspectionHistory';
import { compareBlueprintSnapshots } from './dataTools';
import { BLUEPRINT_VERSION } from '@react-native-blueprint/core';
import type { BlueprintViewport } from '@react-native-blueprint/core';
import type {
  BlueprintDevicePreset,
  BlueprintArtboardDefinition,
} from './BlueprintView';
import {
  serializeBlueprintData,
  useInspectionSnapshot,
  type InspectionStore,
  type BlueprintSourceLocation,
  type BlueprintInspectionConfiguration,
  type BlueprintRenderedElement,
  resolveBlueprintComponentSources,
} from './inspection';

export function WorkbenchButton({
  label,
  onPress,
  active,
  testID,
  variant = 'button',
  icon,
  shortLabel,
}: {
  label: string;
  onPress(): void;
  active?: boolean;
  testID?: string;
  variant?: 'button' | 'tab' | 'text';
  icon?: string;
  shortLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      testID={testID}
      onPress={onPress}
      style={[variant === 'tab' ? s.detailTab : variant === 'text' ? s.textAction : s.button, active && (variant === 'tab' ? s.detailTabActive : s.active)]}
    >
      {icon ? <Text style={[s.detailTabIcon, active && s.detailTabSelected]}>{icon}</Text> : null}
      <Text numberOfLines={1} style={[variant === 'tab' ? s.detailTabLabel : variant === 'text' ? s.textActionLabel : s.buttonText, variant === 'tab' && active && s.detailTabSelected]}>{shortLabel ?? label}</Text>
    </Pressable>
  );
}
export function BlueprintNavigator({
  artboards,
  selectedId,
  select,
  store,
  onCollapse,
}: {
  artboards: readonly BlueprintArtboardDefinition[];
  selectedId?: string;
  select(board: BlueprintArtboardDefinition): void;
  store: InspectionStore;
  onCollapse?: () => void;
}) {
  const [query, setQuery] = useState('');
  const snapshot = useInspectionSnapshot(store);
  const term = query.trim().toLowerCase();
  const matches = artboards.filter((board) =>
    [
      board.id,
      board.label,
      board.groupLabel,
      serializeBlueprintData(board.metadata),
      ...Object.values(snapshot.components[board.id] ?? {}).map(
        (component) =>
          `${component.name} ${component.source ?? ''} ${component.data}`,
      ),
    ]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
  return (
    <View style={s.navigator} testID="blueprint-navigator">
      <View style={s.drawerHeading}>
        <Text style={s.heading}>SCREENS</Text>
        {onCollapse ? <Pressable accessibilityRole="button" accessibilityLabel="Collapse screens drawer" onPress={onCollapse} style={s.drawerCollapse}><Text style={s.drawerChevron}>‹</Text></Pressable> : null}
      </View>
      <TextInput
        accessibilityLabel="Find screens, components or data"
        testID="blueprint-search"
        value={query}
        onChangeText={setQuery}
        placeholder="Find screens, components, data…"
        placeholderTextColor="#8797ab"
        style={s.input}
      />
      <Text style={s.muted}>
        {matches.length} of {artboards.length} previews
      </Text>
      <ScrollView style={{ flex: 1 }}>
        {matches.map((board) => (
          <Pressable
            key={board.id}
            testID={`blueprint-find-${board.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Select ${board.groupLabel ?? board.label} ${board.label}`}
            accessibilityState={{ selected: selectedId === board.id }}
            onPress={() => select(board)}
            style={[s.screen, selectedId === board.id && s.active]}
          >
            <Text style={s.title}>{board.groupLabel ?? board.label}</Text>
            <Text style={s.muted}>
              {board.groupLabel ? board.label : board.id}
            </Text>
            <Text style={s.small}>
              {Object.keys(snapshot.components[board.id] ?? {}).length}{' '}
              inspection regions · {snapshot.metrics[board.id]?.commits ?? 0}{' '}
              commits
            </Text>
          </Pressable>
        ))}
        {!matches.length ? (
          <Text style={s.muted}>
            No matches. Try a route, component name or data value.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
function RenderedElementTree({ element, select, depth = 0, ancestors = [] }: {
  element: BlueprintRenderedElement; select(element: BlueprintRenderedElement, ancestors: readonly BlueprintRenderedElement[]): void; depth?: number; ancestors?: readonly BlueprintRenderedElement[];
}) {
  return <View style={{ paddingLeft: depth ? 12 : 0 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Inspect child ${element.label ?? element.tag}`} onPress={() => select(element, ancestors)} style={s.screen}>
      <Text style={s.title}>{`<${element.tag}>`}{element.role ? ` · ${element.role}` : ''}</Text>
      {element.label ? <Text style={s.small}>{element.label}</Text> : null}
      <Text style={s.small}>{element.childCount} children</Text>
    </Pressable>
    {element.children.map((child, index) => <RenderedElementTree key={index} element={child} select={select} depth={depth + 1} ancestors={[element, ...ancestors].slice(0, 4)} />)}
    {element.childCount > element.children.length ? <Text style={s.small}>{element.childCount - element.children.length} children omitted</Text> : null}
  </View>;
}

export function BlueprintDetails({
  board,
  store,
  refresh,
  refreshLabel = 'Refresh screen',
  onCopy,
  onOpenSource,
  devicePresets,
  onChangeViewport,
  viewportOverridden,
  onCollapse,
  inspecting = false,
  pickRequest = 0,
  configuration,
}: {
  board?: BlueprintArtboardDefinition;
  inspecting?: boolean;
  pickRequest?: number;
  configuration?: BlueprintInspectionConfiguration;
  store: InspectionStore;
  refresh(id: string): void;
  refreshLabel?: string;
  onCopy?: (text: string) => void | Promise<void>;
  onOpenSource?: (source: BlueprintSourceLocation) => void;
  devicePresets: readonly BlueprintDevicePreset[];
  onChangeViewport(viewport?: BlueprintViewport): void;
  viewportOverridden: boolean;
  onCollapse?: () => void;
}) {
  const snapshot = useInspectionSnapshot(store);
  const devToolsStatus = useSyncExternalStore(configuration?.devTools?.subscribe ?? (() => () => {}), configuration?.devTools?.getSnapshot ?? (() => 'unavailable'), configuration?.devTools?.getSnapshot ?? (() => 'unavailable'));
  const [tab, setTab] = useState(inspecting ? 'Components' : 'Data');
  const [showRendered, setShowRendered] = useState(false);
  const [showSourceHelp, setShowSourceHelp] = useState(false);
  const [showScreenInfo, setShowScreenInfo] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);
  const contentScroll = useRef<ScrollView>(null);
  const componentPositions = useRef(new Map<string, number>());
  const [copyStatus, setCopyStatus] = useState('');
  const [componentQuery, setComponentQuery] = useState('');
  const [copyFallback, setCopyFallback] = useState('');
  const [baseline, setBaseline] = useState<{ data: string; at: number } | null>(
    null,
  );
  const [selectedHistoryOnly, setSelectedHistoryOnly] = useState(false);
  useEffect(() => {
    setCopyStatus('');
    setCopyFallback('');
    setComponentQuery('');
  }, [board?.id]);
  const components = Object.values(snapshot.components[board?.id ?? ''] ?? {});
  const visibleIds = snapshot.visibleComponents?.[board?.id ?? ''];
  const listedComponents = visibleIds ? components.filter((component) => visibleIds.includes(component.id)) : components;
  const selected =
    snapshot.selected?.artboardId === board?.id
      ? components.find((c) => c.id === snapshot.selected?.componentId)
      : undefined;
  const element = snapshot.selected?.artboardId === board?.id ? snapshot.selected?.element : undefined;
  const ancestors = snapshot.selected?.artboardId === board?.id ? snapshot.selected?.ancestors ?? [] : [];
  const sources = resolveBlueprintComponentSources(snapshot.components[board?.id ?? ''] ?? {}, selected?.id);
  const source = sources.usage ?? sources.definition;
  const sourceLocation = source?.location;
  const subcomponents = listedComponents.filter((component) => component.parentId === selected?.id && selected);
  useEffect(() => {
    if (pickRequest) { setTab('Components'); setComponentQuery(''); }
  }, [pickRequest]);
  useEffect(() => {
    if (snapshot.selected?.origin === 'canvas') { setTab('Components'); setComponentQuery(''); }
    setCopyStatus('');
    setCopyFallback('');
    if (snapshot.selected?.origin !== 'tree') setShowRendered(false);
  }, [snapshot.selected]);
  useEffect(() => {
    if (tab !== 'Components' || !selected) return;
    const y = componentPositions.current.get(selected.id);
    const node = Platform.OS === 'web' ? contentScroll.current?.getScrollableNode?.() as HTMLElement | undefined : undefined;
    const row = node && Array.from(node.querySelectorAll('[data-testid^="blueprint-component-"]')).find((element) => element.getAttribute('data-testid') === `blueprint-component-${selected.id}`);
    if (row) row.scrollIntoView({ block: 'nearest' });
    else if (y !== undefined) contentScroll.current?.scrollTo({ y, animated: true });
  }, [tab, selected?.id, componentQuery, listedComponents.length]);
  const metrics = snapshot.metrics[board?.id ?? ''];
  const viewport = board?.viewport ?? {
    width: board?.width ?? 375,
    height: board?.height ?? 667,
  };
  useEffect(() => {
    setBaseline(null);
    setSelectedHistoryOnly(false);
  }, [board?.id, selected?.id]);
  const difference =
    baseline && selected
      ? compareBlueprintSnapshots(
          baseline.data,
          String(selected.data ?? 'null'),
        )
      : undefined;
  const report = serializeBlueprintData({
    screen: board
      ? {
          id: board.id,
          label: board.label,
          viewport: board.viewport ?? {
            width: board.width ?? 375,
            height: board.height ?? 667,
          },
          metadata: board.metadata,
        }
      : null,
    component: selected
      ? { ...selected, data: parseData(selected.data) }
      : null,
    element,
    metrics,
    history: snapshot.history[board?.id ?? ''] ?? [],
    comparison: baseline
      ? {
          pinnedAt: baseline.at,
          pinnedData: parseData(baseline.data),
          difference,
        }
      : undefined,
  });
  const copyText = async (payload: string, label: string) => {
    setCopyFallback('');
    try {
      if (onCopy) await onCopy(payload);
      else if (
        Platform.OS === 'web' &&
        globalThis.navigator?.clipboard?.writeText
      )
        await globalThis.navigator.clipboard.writeText(payload);
      else {
        setCopyFallback(payload);
        setCopyStatus('Select the export below to copy');
        return;
      }
      setCopyStatus(`Copied ${label}`);
    } catch {
      setCopyFallback(payload);
      setCopyStatus('Clipboard unavailable. Select the export below.');
    }
  };
  return (
    <View
      style={s.details}
      testID={
        board ? `blueprint-inspector-${board.id}` : 'blueprint-inspector-empty'
      }
    >
      <View style={s.drawerHeading}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={s.drawerTitle}>
            {board?.groupLabel ?? board?.label ?? 'Details'}
          </Text>
          <Text style={s.drawerContext}>
            Inspection{board?.placeholder ? ' · unmounted' : ''}
          </Text>
        </View>
        {onCollapse ? <Pressable accessibilityRole="button" accessibilityLabel="Collapse details drawer" onPress={onCollapse} style={s.drawerCollapse}><Text style={s.drawerChevron}>›</Text></Pressable> : null}
      </View>
      {!board ? (
        <Text style={s.muted}>
          Choose a screen. Turn on Pick component, then select an element to
          view its component and live data.
        </Text>
      ) : (
        <>
          <View style={s.detailTabs} testID="blueprint-details-tabs">
            {[
              ['Components', 'Elements', '▦'], ['Data', 'Data', '{}'],
              ['Activity', 'Activity', '◷'], ['Changes', 'Changes', '↺'],
              ['Viewport', 'Viewport', '▯'], ['Settings', 'Settings', '⚙'],
            ].map(([t, shortLabel, icon]) => <WorkbenchButton key={t} label={t} shortLabel={shortLabel} icon={icon} variant="tab" active={tab === t} onPress={() => setTab(t)} />)}
          </View>
          {(selected || element) && (tab === 'Components' || tab === 'Data') ? <View style={s.selectionSummary} testID="blueprint-selected-component">
            <Text numberOfLines={2} style={s.selectionName}>{sources.usage?.component.usage ? `${sources.usage.component.usage.component} in ${sources.usage.component.usage.owner}` : selected?.name ?? element?.label ?? 'Unregistered element'}</Text>
            <Text style={s.methodLabel} testID="blueprint-selected-methods">{(selected?.methods ?? []).map((method) => method === 'automatic' ? 'Automatic metadata' : method === 'config' ? 'Config mapping' : 'Wrapped example').join(' + ') || 'Exposed region'}{selected?.mappingId ? ` · ${selected.mappingId}` : ''}</Text>
            {sourceLocation ? <>
              <Text selectable numberOfLines={1} ellipsizeMode="middle" style={s.selectionPath} testID="blueprint-source-location">{`${sourceLocation.file}${sourceLocation.line ? `:${sourceLocation.line}${sourceLocation.column ? `:${sourceLocation.column}` : ''}` : ''}`}</Text>
              <Text style={s.methodLabel}>{sources.usage ? 'Usage in your application' : source?.component.id !== selected?.id ? `Source context from ${source?.component.name}` : 'Rendered element implementation'}</Text>
              <View style={s.inlineActions}>
                <WorkbenchButton label="Copy file path" shortLabel="Copy path" variant="text" testID="blueprint-copy-source" onPress={() => copyText(sourceLocation.file, 'file path')} />
                {sourceLocation.line ? <WorkbenchButton label="Copy location" shortLabel="Copy location" variant="text" testID="blueprint-copy-location" onPress={() => copyText(`${sourceLocation.file}:${sourceLocation.line}${sourceLocation.column ? `:${sourceLocation.column}` : ''}`, 'source location')} /> : null}
                {onOpenSource ? <WorkbenchButton label="Open source" shortLabel="Open" variant="text" testID="blueprint-open-source" onPress={() => onOpenSource(sourceLocation)} /> : null}
              </View>
              {sources.usage && sources.definition ? <>
                <WorkbenchButton label={showDefinition ? 'Hide component definition' : 'Show component definition'} shortLabel={showDefinition ? 'Definition −' : 'Definition +'} variant="text" onPress={() => setShowDefinition(!showDefinition)} />
                {showDefinition ? <><Text style={s.methodLabel}>Rendered element: {sources.definition.component.name}</Text><Text selectable style={s.selectionPath} testID="blueprint-definition-location">{`${sources.definition.location.file}:${sources.definition.location.line ?? ''}`}</Text><WorkbenchButton label="Copy definition path" variant="text" onPress={() => copyText(sources.definition!.location.file, 'definition path')} /></> : null}
              </> : null}
            </> : <Text style={s.methodLabel} testID="blueprint-source-location">File not exposed for this component</Text>}
          </View> : null}
          {board.placeholder ? <Text style={s.muted}>This screen is unmounted. Follow a navigation path to mount it.</Text> : null}
          {copyStatus ? <Text accessibilityLiveRegion="polite" style={s.small}>{copyStatus}</Text> : null}
          <ScrollView ref={contentScroll} style={{ flex: 1 }}>
            {copyFallback ? (
              <TextInput
                accessibilityLabel="Copyable inspection report"
                multiline
                value={copyFallback}
                editable
                selectTextOnFocus
                style={s.code}
              />
            ) : null}
            {tab === 'Data' ? (
              <>
                <Text style={s.sectionTitle}>{selected ? 'Element data' : 'No element selected'}</Text>
                {selected ? <Text style={s.small}>
                  {selected
                    ? selected.methods?.includes('automatic') && !selected.methods?.includes('wrapper') ? 'Public element metadata · props and hook state are available in React DevTools' : 'Custom live data shared by this component'
                    : 'Use Pick component or choose an item in Elements to inspect its data.'}
                </Text> : null}
                {selected ? (
                  <View style={s.row}>
                    <WorkbenchButton
                      label={baseline ? 'Update saved data' : 'Save data for comparison'}
                      testID="blueprint-pin-snapshot"
                      onPress={() =>
                        setBaseline({
                          data: String(selected.data ?? 'null'),
                          at: Date.now(),
                        })
                      }
                    />
                    <WorkbenchButton
                      label="Copy component data"
                      testID="blueprint-copy-component"
                      onPress={() =>
                        copyText(
                          String(selected.data ?? 'null'),
                          'component data',
                        )
                      }
                    />
                    {baseline ? (
                      <WorkbenchButton
                        label="Clear saved data"
                        onPress={() => setBaseline(null)}
                      />
                    ) : null}
                  </View>
                ) : null}
                {selected ? <Text style={s.small}>Save these values to compare as the live component data changes.</Text> : null}
                {baseline && difference ? (
                  <SnapshotComparison
                    difference={difference}
                    pinnedAt={baseline.at}
                  />
                ) : null}
                {selected ? <Text
                  selectable
                  style={s.code}
                  testID="blueprint-component-data"
                >
                  {selected.data as string}
                </Text> : <View style={s.emptySelection}><Text style={s.emptyGlyph}>⌖</Text><Text style={s.muted}>Pick an element on the canvas to see its source and data here.</Text></View>}
                <View style={s.sectionDivider}>
                  <WorkbenchButton label={showScreenInfo ? 'Hide screen info' : 'Show screen info'} shortLabel={showScreenInfo ? 'Screen info −' : 'Screen info +'} variant="text" onPress={() => setShowScreenInfo(!showScreenInfo)} />
                  {showScreenInfo ? <Text selectable style={s.code} testID="blueprint-inspector-metadata">{serializeBlueprintData(board.metadata ?? {})}</Text> : null}
                </View>
                <View style={s.sectionDivider}>
                  <Text style={s.drawerContext}>Preview actions</Text>
                  <View style={s.row}>
                    <WorkbenchButton
                      label="Copy report"
                      testID="blueprint-copy-report"
                      onPress={() => copyText(report, 'report')}
                    />
                    {!board.placeholder ? (
                      <WorkbenchButton
                        label={refreshLabel}
                        testID="blueprint-refresh-screen"
                        onPress={() => refresh(board.id)}
                      />
                    ) : null}
                  </View>
                </View>
              </>
            ) : null}
            {tab === 'Components' ? (
              <>
                <Text style={s.small} testID="blueprint-picking-status">{inspecting ? 'Picking on · click an element in the preview' : 'Select a component to highlight it in the preview'}</Text>
                <TextInput
                  accessibilityLabel="Find component data"
                  value={componentQuery}
                  onChangeText={setComponentQuery}
                  placeholder="Find component or value…"
                  placeholderTextColor="#8797ab"
                  style={s.input}
                />
                {listedComponents
                  .filter((c) =>
                    `${c.name} ${c.sourceLocation?.file ?? c.source} ${c.data}`
                      .toLowerCase()
                      .includes(componentQuery.toLowerCase()),
                  )
                  .map((c) => (
                    <Pressable
                      key={c.id}
                      testID={`blueprint-component-${c.id}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selected?.id === c.id }}
                      onLayout={(event) => {
                        const y = event.nativeEvent.layout.y;
                        componentPositions.current.set(c.id, y);
                        if (Platform.OS !== 'web' && selected?.id === c.id && snapshot.selected?.origin === 'canvas') contentScroll.current?.scrollTo({ y, animated: true });
                      }}
                      accessibilityLabel={`Select component ${c.name}`}
                      style={[s.screen, selected?.id === c.id && s.active]}
                      onPress={() => {
                        store.select(board.id, c.id);
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={s.title}>{c.name}</Text>{selected?.id === c.id ? <Text style={s.selectedBadge}>SELECTED</Text> : null}</View>
                      <Text style={s.small}>{c.sourceLocation?.file?.split('/').pop() ?? c.source?.split('#')[0].split('/').pop() ?? 'File not exposed'}{c.sourceLocation?.line ? `:${c.sourceLocation.line}` : ''}</Text>
                      {c.parentId ? <Text style={s.small}>Inside {components.find((parent) => parent.id === c.parentId)?.name ?? c.parentId}</Text> : null}
                    </Pressable>
                  ))}
                {subcomponents.length ? <View style={{ gap: 6 }}>
                  <Text style={s.title}>Child components</Text>
                  {subcomponents.map((child) => <WorkbenchButton key={child.id} label={child.name} onPress={() => store.select(board.id, child.id)} />)}
                </View> : null}
                {element && (element.childCount || ancestors.length) ? <>
                  <WorkbenchButton label={showRendered ? 'Hide rendered elements' : 'Show rendered elements'} testID="blueprint-rendered-toggle" onPress={() => setShowRendered(!showRendered)} />
                  {showRendered ? <>
                    <Text style={s.small}>Browser elements inside this component</Text>
                    {ancestors.length ? <WorkbenchButton label="Inspect parent element" testID="blueprint-inspect-parent" onPress={() => store.selectElement(board.id, ancestors[0], ancestors.slice(1), 'tree')} /> : null}
                    <RenderedElementTree element={element} ancestors={ancestors} select={(child, parents) => store.selectElement(board.id, child, parents, 'tree')} />
                  </> : null}
                </> : null}
                {!listedComponents.length ? (
                  <Text style={s.muted}>
                    {board.placeholder ? 'Components appear when this screen mounts.' : 'No inspection regions exposed by this preview.'}
                  </Text>
                ) : null}
              </>
            ) : null}
            {tab === 'Settings' ? <View style={{ gap: 12 }} testID="blueprint-inspection-settings">
              <View style={s.sourceCard} testID="blueprint-release-info">
                <Text style={s.sourceFile}>Blueprint</Text>
                <Text style={s.title}>{BLUEPRINT_VERSION}</Text>
                {configuration?.release ? <Text selectable style={s.small}>
                  {configuration.release.channel ?? 'Pinned build'} · {configuration.release.sourceCommit.slice(0, 12)}
                </Text> : null}
              </View>
              <Text style={s.sectionTitle}>Inspection sources</Text>
              <Text style={s.muted}>Source, naming and live data providers.</Text>
              <WorkbenchButton label={showSourceHelp ? 'Hide source descriptions' : 'About inspection sources'} variant="text" onPress={() => setShowSourceHelp(!showSourceHelp)} />
              <View style={s.sourceCard}>
                <Text style={s.sourceFile}>Automatic metadata</Text>
                <Text style={s.title}>{configuration?.automatic === false ? 'Disabled' : `${components.filter((c) => c.methods?.includes('automatic')).length} mounted elements`}</Text>
                {showSourceHelp ? <Text style={s.small}>Development compiler annotations supply component names and exact JSX file locations. No extra host views.</Text> : null}
                {showSourceHelp ? <Text style={s.small}>The hierarchy follows rendered elements; use React DevTools for the full React component tree.</Text> : null}
              </View>
              <View style={s.sourceCard}>
                <Text style={s.sourceFile}>Config mappings</Text>
                <Text style={s.title}>{configuration?.mappings?.length ?? 0} rules · {components.filter((c) => c.methods?.includes('config')).length} matching elements</Text>
                {showSourceHelp ? <Text style={s.small}>Existing test IDs, accessibility labels or compiler component names provide overrides. Matching rules take precedence over automatic names and sources.</Text> : null}
                {showSourceHelp ? configuration?.mappings?.map((mapping) => <Text key={mapping.id} style={s.small}>{mapping.name} · {mapping.id}</Text>) : null}
              </View>
              <View style={s.sourceCard}>
                <Text style={s.sourceFile}>React DevTools</Text>
                <Text testID="blueprint-devtools-status" style={s.title}>{devToolsStatus === 'connected' ? 'Companion transport connected' : configuration?.devTools ? 'Waiting for companion' : 'External developer tool'}</Text>
                {showSourceHelp ? <Text style={s.small}>The official companion shows the actual React tree, props and hook state. Those values stay in DevTools; they are not copied into Blueprint.</Text> : null}
                {configuration?.devTools ? <>
                  <WorkbenchButton label="Open React tree" testID="blueprint-open-devtools" onPress={configuration.devTools.open} />
                  <Text selectable style={s.small}>Run yarn example:devtools, then Open React tree to connect this app window.</Text>
                </> : <Text style={s.small}>{Platform.OS === 'web' ? 'Use the React DevTools browser extension, or configure a companion connection.' : 'Open React Native DevTools from Metro (j) for native React tree and hook inspection.'}</Text>}
              </View>
              <View style={s.sourceCard}>
                <Text style={s.sourceFile}>Optional wrappers</Text>
                <Text style={s.title}>{components.filter((c) => !c.methods || c.methods.includes('wrapper')).length} custom data regions</Text>
                {showSourceHelp ? <Text style={s.small}>The Open Social Settings screen is the wrapped example. Wrappers expose deliberate application data for comparison and history.</Text> : null}
              </View>
            </View> : null}
            {tab === 'Viewport' ? (
              <View style={{ gap: 12 }}>
                <Text style={s.title}>Preview viewport</Text>
                <Text style={s.metric} testID="blueprint-viewport-value">
                  {viewport.width} × {viewport.height}
                </Text>
                <Text style={s.muted}>
                  {viewportOverridden ? 'IDE override' : 'Fixture viewport'} ·{' '}
                  {viewport.name ?? 'Custom dimensions'}
                </Text>
                {devicePresets.map((preset) => (
                  <WorkbenchButton
                    key={preset.id}
                    label={preset.name ?? preset.id}
                    testID={`blueprint-device-${preset.id}`}
                    active={
                      viewport.width === preset.width &&
                      viewport.height === preset.height
                    }
                    onPress={() =>
                      onChangeViewport({
                        width: preset.width,
                        height: preset.height,
                        name: preset.name,
                      })
                    }
                  />
                ))}
                <WorkbenchButton
                  label="Rotate viewport"
                  testID="blueprint-rotate-viewport"
                  onPress={() =>
                    onChangeViewport({
                      ...viewport,
                      width: viewport.height,
                      height: viewport.width,
                      name: `${(viewport.name ?? 'Custom viewport').replace(/\s*(portrait|landscape)$/i, '').trim()} ${viewport.height > viewport.width ? 'landscape' : 'portrait'}`,
                    })
                  }
                />
                {viewportOverridden ? (
                  <WorkbenchButton
                    label="Restore fixture viewport"
                    testID="blueprint-restore-viewport"
                    onPress={() => onChangeViewport(undefined)}
                  />
                ) : null}
                <Text style={s.small}>
                  Changes content dimensions without remounting the preview.
                  Global window dimensions, CSS media queries and safe areas
                  remain host-owned. App preview adapters can use
                  useBlueprintPreviewViewport to supply matching responsive
                  context.
                </Text>
              </View>
            ) : null}
            {tab === 'Changes' ? (
              <InspectionHistory
                events={snapshot.history[board.id] ?? []}
                selectedComponentId={selected?.id}
                selectedOnly={selectedHistoryOnly}
                toggleFilter={() => setSelectedHistoryOnly((value) => !value)}
                clear={() => store.clearHistory(board.id)}
              />
            ) : null}
            {tab === 'Activity' ? (
              <>
                <Text style={s.title}>React render activity</Text>
                <Text style={s.metric} testID="blueprint-commits">
                  {metrics?.commits ?? 0} commits
                </Text>
                <Text style={s.muted}>
                  Last render: {(metrics?.lastDuration ?? 0).toFixed(2)} ms
                </Text>
                <Text style={s.muted}>
                  Total render: {(metrics?.totalDuration ?? 0).toFixed(2)} ms
                </Text>
                <Text style={s.muted}>
                  Refreshes: {metrics?.refreshes ?? 0}
                </Text>
                <Text style={s.muted}>
                  Last commit:{' '}
                  {metrics?.lastCommit
                    ? `${metrics.lastCommit.toFixed(0)} ms since runtime start`
                    : 'Awaiting commit'}
                </Text>
                <Text style={s.small}>
                  Profiler timings measure React work in this development
                  runtime, including inspection overhead. They do not measure
                  FPS, native layout, memory, network latency or production
                  performance.
                </Text>
                <Text style={s.small}>
                  Refresh remounts this preview and resets local component
                  state. Shared application stores and network caches stay owned
                  by your providers.
                </Text>
              </>
            ) : null}
          </ScrollView>
        </>
      )}
    </View>
  );
}
function parseData(data: unknown): unknown {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return data;
  }
}
const s = StyleSheet.create({
  drawerTitle: { color: '#edf5ff', fontSize: 16, fontWeight: '600' },
  drawerContext: { color: '#8299b0', fontSize: 10, lineHeight: 15 },
  detailTabs: { flexDirection: 'row', flexWrap: 'nowrap', gap: 2, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#263749' },
  detailTab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', height: 44, gap: 3, borderRadius: 6 },
  detailTabActive: { backgroundColor: '#183e45' },
  detailTabIcon: { color: '#879fb6', fontSize: 16, lineHeight: 19 },
  detailTabLabel: { color: '#91a7bc', fontSize: 9, lineHeight: 12 },
  detailTabSelected: { color: '#80e6cc' },
  selectionSummary: { backgroundColor: '#152535', borderLeftWidth: 2, borderColor: '#4dd9b4', borderRadius: 5, padding: 10, gap: 4 },
  selectionName: { color: '#ecf6ff', fontSize: 14, fontWeight: '600' },
  selectionPath: { color: '#77dabe', fontSize: 10, lineHeight: 16 },
  methodLabel: { color: '#8fa6bc', fontSize: 10, lineHeight: 15 },
  inlineActions: { flexDirection: 'row', flexWrap: 'nowrap', gap: 10 },
  textAction: { paddingVertical: 6, alignSelf: 'flex-start' },
  textActionLabel: { color: '#b9d4e9', fontSize: 11, fontWeight: '500' },
  sectionTitle: { color: '#edf5ff', fontSize: 15, fontWeight: '600', marginTop: 4 },
  sectionDivider: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#263749', gap: 8 },
  emptySelection: { padding: 20, gap: 12, alignItems: 'center', marginVertical: 16, backgroundColor: '#0e1927', borderRadius: 8 },
  emptyGlyph: { color: '#577e97', fontSize: 32 },

  drawerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drawerCollapse: { minWidth: 28, minHeight: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#213247' },
  drawerChevron: { color: '#b6cbe2', fontSize: 20 },
  navigator: {
    flex: 1,
    width: 232,
    padding: 14,
    backgroundColor: '#111b2a',
    borderRightWidth: 1,
    borderColor: '#2b3b50',
    gap: 10,
  },
  details: {
    flex: 1,
    width: 324,
    padding: 14,
    backgroundColor: '#111b2a',
    borderLeftWidth: 1,
    borderColor: '#2b3b50',
    gap: 10,
  },
  selectedBadge: { color: '#83e7ce', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  sourceCard: { backgroundColor: '#182a3b', borderColor: '#33556c', borderWidth: 1, borderRadius: 9, padding: 12, gap: 5 },
  sourceTitle: { color: '#ecf6ff', fontSize: 17, fontWeight: '600' },
  sourceFile: { color: '#74e1c3', fontSize: 13, fontWeight: '600' },
  heading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#7ba1ca',
  },
  input: {
    color: '#edf5ff',
    borderWidth: 1,
    borderColor: '#36475e',
    padding: 10,
    borderRadius: 6,
    fontSize: 12,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 5,
    backgroundColor: '#24354a',
  },
  active: { backgroundColor: '#214d54', borderColor: '#4dd9b4' },
  buttonText: { color: '#edf5ff', fontSize: 12, fontWeight: '600' },
  screen: {
    padding: 11,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: '#1b2a3c',
    gap: 4,
  },
  title: { color: '#e8f2ff', fontSize: 13, fontWeight: '600' },
  large: { color: '#edf5ff', fontSize: 19, fontWeight: '700' },
  muted: { color: '#a9bbcf', fontSize: 12, lineHeight: 18 },
  small: { color: '#8ea4bc', fontSize: 11, lineHeight: 17, marginVertical: 4 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  code: {
    color: '#aee8d9',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 17,
    backgroundColor: '#0b1422',
    padding: 10,
    marginVertical: 8,
    borderRadius: 5,
  },
  metric: { color: '#4dd9b4', fontSize: 26, marginVertical: 12 },
});
