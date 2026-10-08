import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  createBlueprintFlowState,
  navigateBlueprintFlow,
  backBlueprintFlow,
  type BlueprintFlowRoute,
  type BlueprintFlowMap,
} from '@react-native-blueprint/core';
import { captureBlueprintWebScreen } from './screenSnapshot';
import type { BlueprintViewport } from '@react-native-blueprint/core';
import {
  BlueprintView,
  type BlueprintArtboardDefinition,
  type BlueprintViewProps,
} from './BlueprintView';

export type BlueprintFlowNavigation = {
  navigate(route: BlueprintFlowRoute): void;
  goBack(): void;
  canGoBack: boolean;
  active: boolean;
};
export type BlueprintNavigationFlowConfig = {
  initialRoute: BlueprintFlowRoute;
  navigationMap?: BlueprintFlowMap;
  /** Return a screen element wired to the supplied navigation actions. */
  renderScreen(
    route: BlueprintFlowRoute,
    navigation: BlueprintFlowNavigation,
  ): ReactNode;
  /** One app-owned provider tree shared by the live branch. */
  wrapScreens?: (screens: ReactNode) => ReactNode;
  /** App-owned native/media capture; return an image URI before the view unmounts. */
  captureScreen?: (route: BlueprintFlowRoute, view: View) => Promise<string | undefined>;

};
const FlowNavigation = createContext<BlueprintFlowNavigation | undefined>(
  undefined,
);
export function useBlueprintFlowNavigation() {
  return useContext(FlowNavigation);
}

export function BlueprintNavigationFlow({
  toolbarContent,
  configuration,
  viewport,
  previewProps,
}: {
  toolbarContent?: ReactNode;
  configuration: BlueprintNavigationFlowConfig;
  viewport?: BlueprintViewport;
  previewProps?: Omit<
    BlueprintViewProps,
    'artboards' | 'selectedArtboardId' | 'onSelectArtboard'
  >;
}) {
  const [session, setSession] = useState(0);
  const [mapped, setMapped] = useState(true);
  const actions = (
    <View style={styles.toolbar}>
      {configuration.navigationMap ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            mapped ? 'Discover paths without map' : 'Use navigation map'
          }
          accessibilityHint="Changing map policy starts a fresh flow."
          testID="blueprint-flow-map-toggle"
          onPress={() => setMapped(!mapped)}
          style={styles.button}
        >
          <Text style={styles.text}>{mapped ? 'Mapped' : 'Discover'}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restart flow"
        testID="blueprint-flow-restart"
        onPress={() => setSession((value) => value + 1)}
        style={styles.button}
      >
        <Text style={styles.text}>Restart</Text>
      </Pressable>
    </View>
  );
  return (
    <View style={styles.fill}>
      <FlowSession
        key={`${session}:${mapped}`}
        configuration={configuration}
        toolbarContent={toolbarContent}
        toolbarActions={actions}
        mapped={mapped}
        viewport={viewport}
        previewProps={previewProps}
      />
    </View>
  );
}

function FlowSession({
  toolbarContent,
  toolbarActions,
  configuration,
  mapped,
  viewport,
  previewProps,
}: {
  toolbarContent?: ReactNode;
  toolbarActions: ReactNode;
  configuration: BlueprintNavigationFlowConfig;
  mapped: boolean;
  viewport?: BlueprintViewport;
  previewProps?: Omit<
    BlueprintViewProps,
    'artboards' | 'selectedArtboardId' | 'onSelectArtboard'
  >;
}) {
  const [state, setState] = useState(() =>
    createBlueprintFlowState(
      configuration.initialRoute,
      mapped ? configuration.navigationMap : undefined,
    ),
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const screenViews = useRef(new Map<string, View>());
  const alive = useRef(true);
  const pending = useRef(false);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const registerScreen = useCallback((id: string, view: View | null) => {
    if (view) screenViews.current.set(id, view);
    else screenViews.current.delete(id);
  }, []);
  const dispatch = useCallback((from: string, destination?: BlueprintFlowRoute) => {
    if (pending.current) return;
    const previous = stateRef.current;
    const next = destination ? navigateBlueprintFlow(previous, from, destination) : backBlueprintFlow(previous, from);
    if (next === previous) return;
    const removed = previous.stack.filter((id) => !next.stack.includes(id));
    const apply = () => {
      if (!alive.current) return;
      stateRef.current = next;
      setState(next);
    };
    if (!removed.length || (Platform.OS !== 'web' && !configuration.captureScreen)) { apply(); return; }
    pending.current = true;
    const capture = async () => {
      const captured = await Promise.all(removed.map(async (id) => {
        const view = screenViews.current.get(id);
        const route = previous.nodes.find((node) => node.route.id === id)?.route;
        if (!view || !route) return [id, undefined] as const;
        let cancelTimeout = () => {};
        try {
          const uri = await Promise.race([
            configuration.captureScreen ? configuration.captureScreen(route, view) : captureBlueprintWebScreen(view),
            new Promise<undefined>((resolve) => { const timeout = setTimeout(() => resolve(undefined), 1500); cancelTimeout = () => clearTimeout(timeout); }),
          ]);
          return [id, uri] as const;
        } catch { return [id, undefined] as const; }
        finally { cancelTimeout(); }
      }));
      if (alive.current) {
        setSnapshots((current) => {
          const images = { ...current };
          for (const [id, uri] of captured) {
            if (uri) images[id] = uri;
            else delete images[id];
          }
          return images;
        });
        apply();
      }
      pending.current = false;
    };
    void capture();
  }, [configuration.captureScreen]);
  const activeId = state.stack[state.stack.length - 1];
  const [selection, setSelection] = useState<{
    id: string;
    sequence: number;
  }>();
  const sequence = state.transition?.sequence ?? 0;
  const selectedId = selection?.sequence === sequence ? selection.id : activeId;
  const boards = useMemo<readonly BlueprintArtboardDefinition[]>(
    () =>
      state.nodes.map((node) => {
        const index = state.stack.indexOf(node.route.id);
        const mounted = index >= 0;
        return {
          id: node.route.id,
          label: `${node.route.name} · ${mounted ? 'Live' : 'Placeholder'}`,
          groupLabel: node.route.name,
          parentArtboardId: node.parentId,
          viewport: node.route.viewport ?? viewport,
          placeholder: !mounted,
          metadata: {
            route: node.route,
            status: mounted
              ? 'mounted'
              : node.visited
                ? 'unmounted'
                : 'not-visited',
            active: node.route.id === activeId,
          },
          content: mounted ? (
            <FlowScreen
              route={node.route}
              renderScreen={configuration.renderScreen}
              dispatch={dispatch}
              registerScreen={registerScreen}
              canGoBack={index > 0}
              active={node.route.id === activeId}
            />
          ) : (
            <View
              style={styles.placeholder}
              testID={`blueprint-flow-placeholder-${node.route.id}`}
            >
              {snapshots[node.route.id] ? <>
                <Image source={{ uri: snapshots[node.route.id] }} accessibilityLabel={`Last view of ${node.route.name}`} testID={`blueprint-flow-snapshot-${node.route.id}`} resizeMode="stretch" style={styles.snapshot} />
                <View pointerEvents="none" style={styles.snapshotShade} />
              </> : null}
              <View style={snapshots[node.route.id] ? styles.snapshotBadge : undefined}>
              <Text style={styles.placeholderTitle}>
                {node.visited ? snapshots[node.route.id] ? 'Last view · Unmounted' : 'Unmounted' : 'Not visited'}
              </Text>
              <Text style={styles.hint}>
                {node.visited
                  ? 'Navigate here to mount this screen again.'
                  : 'Follow a navigation path to mount this screen.'}
              </Text>
              </View>
            </View>
          ),
        };
      }),
    [state, viewport, configuration.renderScreen, activeId, snapshots, dispatch, registerScreen],
  );
  const canvas = (
    <View style={styles.fill}>
      <BlueprintView
        {...previewProps}
        artboards={boards}
        toolbarContent={toolbarContent}
        toolbarActions={toolbarActions}
        toolbarStatus={
          <View style={styles.statusRow}>
            <Text
              numberOfLines={1}
              style={styles.status}
              testID="blueprint-flow-status"
            >
              {state.stack
                .map(
                  (id) =>
                    state.nodes.find((node) => node.route.id === id)?.route
                      .name,
                )
                .join('  ›  ')}
            </Text>
            <Text style={styles.hint}>
              {state.stack.length} live ·{' '}
              {state.nodes.length - state.stack.length} placeholders
            </Text>
          </View>
        }
        layout="hierarchy"
        connections={state.links}
        navigationTransition={state.transition}
        focusRequest={{ id: activeId, sequence }}
        selectedArtboardId={selectedId}
        defaultSelectedArtboardId={undefined}
        onSelectArtboard={(board) => {
          if (board) setSelection({ id: board.id, sequence });
        }}
        showFocusControl={false}
        fitOnMount={false}
        refreshLabel="Restart screen"
      />
    </View>
  );
  return configuration.wrapScreens ? configuration.wrapScreens(canvas) : canvas;
}

const FlowScreen = memo(function FlowScreen({
  route,
  renderScreen,
  dispatch,
  registerScreen,
  canGoBack,
  active,
}: {
  route: BlueprintFlowRoute;
  renderScreen: BlueprintNavigationFlowConfig['renderScreen'];
  dispatch(from: string, destination?: BlueprintFlowRoute): void;
  registerScreen(id: string, view: View | null): void;
  canGoBack: boolean;
  active: boolean;
}) {
  const navigate = useCallback(
    (destination: BlueprintFlowRoute) =>
      dispatch(route.id, destination),
    [dispatch, route.id],
  );
  const goBack = useCallback(
    () => dispatch(route.id),
    [dispatch, route.id],
  );
  const setView = useCallback((view: View | null) => registerScreen(route.id, view), [registerScreen, route.id]);
  const navigation = useMemo(
    () => ({ navigate, goBack, canGoBack, active }),
    [navigate, goBack, canGoBack, active],
  );
  return (
    <FlowNavigation.Provider value={navigation}>
      <View ref={setView} collapsable={false} style={styles.fill}>{renderScreen(route, navigation)}</View>
    </FlowNavigation.Provider>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  button: { backgroundColor: '#1b2a3c', borderRadius: 6, padding: 10 },
  text: { color: '#edf4ff', fontSize: 12 },
  hint: { color: '#93a9c3', fontSize: 12, lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { color: '#d3e4f5', fontSize: 11, fontWeight: '600', flexShrink: 1 },
  placeholder: {
    flex: 1,
    backgroundColor: '#101c2c',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  snapshot: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  snapshotShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,20,34,0.2)' },
  snapshotBadge: { position: 'absolute', left: 16, right: 16, bottom: 20, padding: 16, borderRadius: 12, backgroundColor: 'rgba(11,20,34,0.9)' },
  placeholderTitle: {
    color: '#829ab4',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
});
