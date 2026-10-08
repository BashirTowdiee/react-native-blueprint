import React, {
  type ReactNode,
  Profiler,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  PanResponder,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type {
  BlueprintMetadata,
  BlueprintViewport,
  BlueprintFlowLink,
} from '@react-native-blueprint/core';
import { attachBlueprintCanvasDrag } from './canvasGestures';
import { layoutBlueprintHierarchy } from './flowLayout';
import { FlowConnections, type BlueprintFlowTransition } from './FlowConnections';

import {
  clampBlueprintZoom,
  DEFAULT_BLUEPRINT_MAX_ZOOM,
  DEFAULT_BLUEPRINT_MIN_ZOOM,
  DEFAULT_BLUEPRINT_ZOOM_STEP,
} from './zoom';

import {
  createInspectionStore,
  BlueprintInspectionConfigurationProvider,
  type BlueprintInspectionConfiguration,
  BlueprintInspectionProvider,
  BlueprintElementPicker,
  type BlueprintSourceLocation,
  type InspectionStore,
} from './inspection';
import {
  BlueprintNavigator,
  BlueprintDetails,
  WorkbenchButton,
} from './Workbench';

const DEFAULT_ARTBOARD_WIDTH = 375;
const DEFAULT_ARTBOARD_HEIGHT = 667;
const ARTBOARD_MARGIN = 10;
const ARTBOARD_BORDER = 10;
const ARTBOARD_HEADER_HEIGHT = 48;
const CANVAS_PADDING = 40;
const FIT_PADDING = 32;
const GROUP_GAP = 32;
const GROUP_LABEL_HEIGHT = 28;

export type BlueprintDevicePreset = BlueprintViewport & {
  id: string;
};

export const BLUEPRINT_DEVICE_PRESETS: readonly BlueprintDevicePreset[] = [
  {
    id: 'phone-compact',
    name: 'Compact phone',
    width: 375,
    height: 667,
  },
  {
    id: 'phone-standard',
    name: 'Standard phone',
    width: 390,
    height: 844,
  },
  {
    id: 'tablet-portrait',
    name: 'Tablet portrait',
    width: 768,
    height: 1024,
  },
];

export function createBlueprintViewportFromPreset(
  presetId: string,
): BlueprintViewport {
  const preset = BLUEPRINT_DEVICE_PRESETS.find(({ id }) => id === presetId);

  if (!preset) {
    throw new RangeError(`Unknown Blueprint device preset: ${presetId}`);
  }

  return {
    width: preset.width,
    height: preset.height,
    name: preset.name,
  };
}

type WheelEventLike = {
  ctrlKey?: boolean;
  deltaY: number;
  preventDefault(): void;
};

type WheelTarget = {
  addEventListener(
    type: 'wheel',
    listener: (event: WheelEventLike) => void,
    options?: { passive?: boolean },
  ): void;
  removeEventListener(
    type: 'wheel',
    listener: (event: WheelEventLike) => void,
  ): void;
};

export type BlueprintArtboardDefinition = {
  id: string;
  label: string;
  content: ReactNode;
  viewport?: BlueprintViewport;
  width?: number;
  height?: number;
  groupId?: string;
  groupLabel?: string;
  metadata?: BlueprintMetadata;
  parentArtboardId?: string;
  placeholder?: boolean;
};

export type BlueprintArtboardProps = {
  label: string;
  children: ReactNode;
  width?: number;
  height?: number;
  viewportName?: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  appearance?: 'classic' | 'flow';
  flowStatus?: 'active' | 'mounted' | 'placeholder';
};

export function BlueprintArtboard({
  label,
  children,
  width = DEFAULT_ARTBOARD_WIDTH,
  height = DEFAULT_ARTBOARD_HEIGHT,
  viewportName,
  selected = false,
  onPress,
  style,
  testID,
  appearance = 'classic',
  flowStatus = 'mounted',
}: BlueprintArtboardProps) {
  const flow = appearance === 'flow';
  return (
    <View
      testID={testID}
      style={[
        styles.artboard,
        selected ? styles.selectedArtboard : null,
        flow ? styles.flowArtboard : null,
        flow && flowStatus === 'active' ? styles.activeFlowArtboard : null,
        flow && flowStatus === 'placeholder' ? styles.placeholderFlowArtboard : null,
        {
          width: width + ARTBOARD_BORDER * 2,
          height: height + ARTBOARD_BORDER * 2 + ARTBOARD_HEADER_HEIGHT,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select artboard ${label}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        testID={testID ? `${testID}-select` : undefined}
        style={{
          height: ARTBOARD_HEADER_HEIGHT,
          backgroundColor: flow ? '#152337' : '#333333',
          justifyContent: 'center',
        }}
      >
        <Text style={[styles.artboardLabel, flow ? styles.flowArtboardLabel : null]}>{label}</Text>
        <Text
          style={[styles.artboardViewport, flow ? styles.flowArtboardViewport : null]}
          testID={testID ? `${testID}-viewport` : undefined}
        >
          {[viewportName, `${width} × ${height}`].filter(Boolean).join(' · ')}
        </Text>
      </Pressable>
      <View style={[styles.artboardContent, flow ? styles.flowArtboardContent : null]}>{children}</View>
    </View>
  );
}

export type BlueprintViewProps = {
  artboards: readonly BlueprintArtboardDefinition[];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  showZoomControls?: boolean;
  fitOnMount?: boolean;
  showInspector?: boolean;
  showNavigator?: boolean;
  showFocusControl?: boolean;
  toolbarContent?: ReactNode;
  toolbarStatus?: ReactNode;
  toolbarActions?: ReactNode;
  refreshLabel?: string;
  layout?: 'groups' | 'hierarchy';
  connections?: readonly BlueprintFlowLink[];
  navigationTransition?: BlueprintFlowTransition;
  focusRequest?: { id: string; sequence: number };
  onCopy?: (text: string) => void | Promise<void>;
  onOpenSource?: (source: BlueprintSourceLocation) => void;
  inspection?: BlueprintInspectionConfiguration;
  selectedArtboardId?: string;
  defaultSelectedArtboardId?: string;
  style?: StyleProp<ViewStyle>;
  artboardStyle?: StyleProp<ViewStyle>;
  artboardAppearance?: 'classic' | 'flow';
  onZoomChange?: (zoom: number) => void;
  onSelectArtboard?: (
    artboard: BlueprintArtboardDefinition | undefined,
  ) => void;
};

export function BlueprintView({
  artboards,
  inspection,
  initialZoom = 0.5,
  minZoom = DEFAULT_BLUEPRINT_MIN_ZOOM,
  maxZoom = DEFAULT_BLUEPRINT_MAX_ZOOM,
  zoomStep = DEFAULT_BLUEPRINT_ZOOM_STEP,
  showZoomControls = true,
  fitOnMount = true,
  showInspector = true,
  selectedArtboardId,
  showNavigator = true,
  showFocusControl = true,
  toolbarContent,
  toolbarStatus,
  toolbarActions,
  refreshLabel = 'Refresh screen',
  layout = 'groups',
  connections = [],
  navigationTransition,
  focusRequest,
  onCopy,
  onOpenSource,
  defaultSelectedArtboardId,
  style,
  artboardStyle,
  artboardAppearance = 'classic',
  onZoomChange,
  onSelectArtboard,
}: BlueprintViewProps) {
  const inspectionStore = useMemo(() => createInspectionStore(), []);
  const [inspecting, setInspecting] = useState(false);
  const [pickRequest, setPickRequest] = useState(0);
  const [navigatorOpen, setNavigatorOpen] = useState(showNavigator);
  const [inspectorOpen, setInspectorOpen] = useState(showInspector);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});
  const [focused, setFocused] = useState(!!defaultSelectedArtboardId);
  const [rootWidth, setRootWidth] = useState(1200);
  const [viewportOverrides, setViewportOverrides] = useState<
    Record<string, BlueprintViewport>
  >({});
  const effectiveArtboards = useMemo(
    () =>
      artboards.map((board) =>
        viewportOverrides[board.id]
          ? { ...board, viewport: viewportOverrides[board.id] }
          : board,
      ),
    [artboards, viewportOverrides],
  );
  const refreshScreen = (id: string) => {
    inspectionStore.refresh(id);
    setRefreshKeys((keys) => ({ ...keys, [id]: (keys[id] ?? 0) + 1 }));
  };
  const [zoom, setZoomState] = useState(() =>
    clampBlueprintZoom(initialZoom, minZoom, maxZoom),
  );
  const [internalSelectedArtboardId, setInternalSelectedArtboardId] = useState(
    defaultSelectedArtboardId,
  );
  const [fitToCanvas, setFitToCanvas] = useState(fitOnMount);
  const [workspaceSize, setWorkspaceSize] = useState({ width: 0, height: 0 });
  const workspaceRef = useRef<View>(null);
  const verticalScroll = useRef<ScrollView>(null);
  const horizontalScroll = useRef<ScrollView>(null);
  const lastFocusRequest = useRef<string>();
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [cameraRevision, setCameraRevision] = useState(0);
  const canvasSurface = useRef<View>(null);
  const nativePanOrigin = useRef({ x: 0, y: 0 });
  const cameraPositionRef = useRef(cameraPosition);
  cameraPositionRef.current = cameraPosition;
  const nativeCanvasPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (event) => {
      if (Platform.OS === 'web') return false;
      const surface = findNodeHandle(canvasSurface.current);
      return surface !== null && String(event.nativeEvent.target) === String(surface);
    },
    onPanResponderGrant: () => { nativePanOrigin.current = cameraPositionRef.current; },
    onPanResponderMove: (_event, gesture) => {
      horizontalScroll.current?.scrollTo({ x: Math.max(0, nativePanOrigin.current.x - gesture.dx), animated: false });
      verticalScroll.current?.scrollTo({ y: Math.max(0, nativePanOrigin.current.y - gesture.dy), animated: false });
    },
  }), []);
  const cameraPaddingX = layout === 'hierarchy' && workspaceSize.width ? workspaceSize.width / 2 : FIT_PADDING;
  const cameraPaddingY = layout === 'hierarchy' && workspaceSize.height ? workspaceSize.height / 2 : FIT_PADDING;
  const activeSelectedArtboardId =
    selectedArtboardId ?? internalSelectedArtboardId;
  const selectedArtboard = effectiveArtboards.find(
    ({ id }) => id === activeSelectedArtboardId,
  );
  const groups = useMemo(
    () => groupArtboards(effectiveArtboards),
    [effectiveArtboards],
  );
  const hierarchy = useMemo(
    () => layout === 'hierarchy' ? layoutBlueprintHierarchy(effectiveArtboards) : undefined,
    [layout, effectiveArtboards],
  );
  const canvasSize = useMemo(
    () =>
      hierarchy ?? measureCanvas(
        groupArtboards(
          focused && selectedArtboard ? [selectedArtboard] : effectiveArtboards,
        ),
      ),
    [effectiveArtboards, focused, selectedArtboard, hierarchy],
  );

  const activeFlowBox = focusRequest && hierarchy?.boxes[focusRequest.id];
  const activeFocusZoom = activeFlowBox ? Math.min(initialZoom, calculateFitZoom(activeFlowBox, workspaceSize, minZoom, maxZoom)) : zoom;
  const activeCamera = activeFlowBox ? {
    x: Math.max(0, (activeFlowBox.x + activeFlowBox.width / 2) * zoom + cameraPaddingX - workspaceSize.width / 2),
    y: Math.max(0, (activeFlowBox.y + activeFlowBox.height / 2) * zoom + cameraPaddingY - workspaceSize.height / 2),
  } : undefined;
  const awayFromActive = !!activeCamera && workspaceSize.width > 0 && workspaceSize.height > 0 && (
    Math.abs(zoom - activeFocusZoom) > 0.02 || Math.abs(cameraPosition.x - activeCamera.x) > 32 || Math.abs(cameraPosition.y - activeCamera.y) > 32
  );

  const setZoom = useCallback(
    (nextZoom: number | ((currentZoom: number) => number)) => {
      setZoomState((currentZoom) => {
        const requestedZoom =
          typeof nextZoom === 'function' ? nextZoom(currentZoom) : nextZoom;
        const boundedZoom = clampBlueprintZoom(requestedZoom, minZoom, maxZoom);

        if (boundedZoom !== currentZoom) {
          onZoomChange?.(boundedZoom);
        }

        return boundedZoom;
      });
    },
    [maxZoom, minZoom, onZoomChange],
  );

  useEffect(() => {
    if (!hierarchy || !focusRequest || !workspaceSize.width || !workspaceSize.height) return;
    const box = hierarchy.boxes[focusRequest.id];
    if (!box) return;
    const request = `${focusRequest.id}:${focusRequest.sequence}:${box.width}:${box.height}:${workspaceSize.width}:${workspaceSize.height}`;
    if (lastFocusRequest.current === request) return;
    lastFocusRequest.current = request;
    // Keep the entire destination device readable within the available workspace.
    setFitToCanvas(false);
    setZoom(Math.min(initialZoom, calculateFitZoom(box, workspaceSize, minZoom, maxZoom)));
  }, [hierarchy, focusRequest?.id, focusRequest?.sequence, workspaceSize, initialZoom, minZoom, maxZoom, setZoom]);

  useEffect(() => {
    if (!hierarchy || !focusRequest || !workspaceSize.width || !workspaceSize.height) return;
    const box = hierarchy.boxes[focusRequest.id];
    if (!box) return;
    const x = Math.max(0, fitToCanvas
      ? (hierarchy.width * zoom + cameraPaddingX * 2 - workspaceSize.width) / 2
      : (box.x + box.width / 2) * zoom + cameraPaddingX - workspaceSize.width / 2);
    const y = Math.max(0, fitToCanvas
      ? (hierarchy.height * zoom + cameraPaddingY * 2 - workspaceSize.height) / 2
      : (box.y + box.height / 2) * zoom + cameraPaddingY - workspaceSize.height / 2);
    if (Platform.OS === 'web') {
      verticalScroll.current?.scrollTo({ x, y, animated: true });
    } else {
      horizontalScroll.current?.scrollTo({ x, animated: true });
      verticalScroll.current?.scrollTo({ y, animated: true });
    }
  }, [hierarchy, focusRequest?.id, focusRequest?.sequence, workspaceSize, zoom, fitToCanvas, cameraPaddingX, cameraPaddingY, cameraRevision]);

  const zoomIn = useCallback(() => {
    setFitToCanvas(false);
    setZoom((currentZoom) => currentZoom + zoomStep);
  }, [setZoom, zoomStep]);

  const zoomOut = useCallback(() => {
    setFitToCanvas(false);
    setZoom((currentZoom) => currentZoom - zoomStep);
  }, [setZoom, zoomStep]);

  const fitCanvas = useCallback(() => {
    if (workspaceSize.width <= 0 || workspaceSize.height <= 0) {
      return;
    }

    setFitToCanvas(true);
    setZoom(calculateFitZoom(canvasSize, workspaceSize, minZoom, maxZoom));
  }, [canvasSize, maxZoom, minZoom, setZoom, workspaceSize]);

  const selectArtboard = useCallback(
    (artboard: BlueprintArtboardDefinition | undefined) => {
      if (selectedArtboardId === undefined) {
        setInternalSelectedArtboardId(artboard?.id);
      }
      setInspectorOpen(showInspector);
      onSelectArtboard?.(artboard);
    },
    [onSelectArtboard, selectedArtboardId, showInspector],
  );

  const resetCanvas = useCallback(() => {
    setFitToCanvas(false);
    setZoom(initialZoom);
    const defaultArtboard = defaultSelectedArtboardId
      ? artboards.find(({ id }) => id === defaultSelectedArtboardId)
      : undefined;
    selectArtboard(defaultArtboard);
  }, [
    artboards,
    defaultSelectedArtboardId,
    initialZoom,
    selectArtboard,
    setZoom,
  ]);

  const handleWheel = useCallback(
    (event: WheelEventLike) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      setFitToCanvas(false);
      setZoom((currentZoom) =>
        event.deltaY < 0 ? currentZoom + zoomStep : currentZoom - zoomStep,
      );
    },
    [setZoom, zoomStep],
  );

  const handleWorkspaceLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setWorkspaceSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }, []);

  useEffect(() => {
    if (!fitToCanvas || workspaceSize.width <= 0 || workspaceSize.height <= 0) {
      return;
    }

    setZoom(calculateFitZoom(canvasSize, workspaceSize, minZoom, maxZoom));
  }, [canvasSize, fitToCanvas, maxZoom, minZoom, setZoom, workspaceSize]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const target = workspaceRef.current as unknown as Partial<WheelTarget>;
    if (!target.addEventListener || !target.removeEventListener) {
      return;
    }

    target.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      target.removeEventListener?.('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <BlueprintInspectionConfigurationProvider value={inspection}>
    <View
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width < 1000 && rootWidth >= 1000) setNavigatorOpen(false);
        if (width < 760 && rootWidth >= 760) setInspectorOpen(false);
        setRootWidth(width);
      }}
      style={[styles.root, style]}
      testID="blueprint-workspace"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerScroll} contentContainerStyle={[styles.workbenchToolbar, { minWidth: rootWidth }]} testID="blueprint-workspace-header">
        {toolbarContent ?? <Text style={styles.workbenchBrand}>
          BLUEPRINT{' '}
          <Text style={styles.workbenchSubtitle}> / development workspace</Text>
        </Text>}
        {toolbarStatus ? <View style={styles.workbenchStatus}>{toolbarStatus}</View> : null}
        <View style={styles.workbenchActions}>
          {toolbarActions}
          <WorkbenchButton
            label="Pick component"
            testID="blueprint-inspect-toggle"
            active={inspecting}
            onPress={() => {
              setInspecting(!inspecting);
              if (!inspecting) {
                setInspectorOpen(showInspector);
                setPickRequest((value) => value + 1);
              }
            }}
          />
          {showFocusControl ? (
            <WorkbenchButton
              label={focused ? 'Show all' : 'Focus screen'}
              testID="blueprint-focus"
              active={focused}
              onPress={() => setFocused(!focused)}
            />
          ) : null}

        </View>
      </ScrollView>
      <View style={styles.workbenchBody}>
        {navigatorOpen && showNavigator ? (
          <View
            style={
              rootWidth < 1000
                ? {
                    position: 'absolute',
                    zIndex: 4,
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: Math.min(232, rootWidth),
                  }
                : {}
            }
          >
            <BlueprintNavigator
              onCollapse={() => setNavigatorOpen(false)}
              artboards={effectiveArtboards}
              selectedId={activeSelectedArtboardId}
              select={(board) => {
                selectArtboard(board);
                setFocused(true);
                setFitToCanvas(true);
                if (rootWidth < 1000) setNavigatorOpen(false);
              }}
              store={inspectionStore}
            />
          </View>
        ) : null}
        <View
          ref={workspaceRef}
          style={styles.canvasWorkspace}
          onLayout={handleWorkspaceLayout}
          testID="blueprint-canvas-workspace"
        >
          {showNavigator && !navigatorOpen ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Open screens drawer" testID="blueprint-reopen-screens" onPress={() => setNavigatorOpen(true)} style={[styles.drawerTab, { left: 0 }]}>
              <Text style={styles.drawerTabText}>› Screens</Text>
            </Pressable>
          ) : null}
          {showInspector && !inspectorOpen ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Open details drawer" testID="blueprint-reopen-details" onPress={() => setInspectorOpen(true)} style={[styles.drawerTab, { right: 0 }]}>
              <Text style={styles.drawerTabText}>Details ‹</Text>
            </Pressable>
          ) : null}
          {showZoomControls ? (
            <View style={styles.zoomControls}>
              <Pressable
                accessibilityLabel="Zoom out"
                accessibilityRole="button"
                onPress={zoomOut}
                style={styles.zoomButton}
                testID="blueprint-zoom-out"
              >
                <Text style={styles.zoomButtonText}>−</Text>
              </Pressable>
              <Text style={styles.zoomValue} testID="blueprint-zoom-value">
                {`${Math.round(zoom * 100)}%`}
              </Text>
              <Pressable
                accessibilityLabel="Zoom in"
                accessibilityRole="button"
                onPress={zoomIn}
                style={styles.zoomButton}
                testID="blueprint-zoom-in"
              >
                <Text style={styles.zoomButtonText}>+</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Fit visible screens"
                accessibilityRole="button"
                onPress={fitCanvas}
                style={styles.resetButton}
                testID="blueprint-fit"
              >
                <Text style={styles.resetButtonText}>Fit</Text>
              </Pressable>
              {awayFromActive ? <Pressable
                accessibilityLabel="Focus active screen"
                accessibilityRole="button"
                testID="blueprint-focus-active"
                style={[styles.resetButton, { backgroundColor: '#1d4843', borderRadius: 6 }]}
                onPress={() => {
                  setFitToCanvas(false);
                  setZoom(activeFocusZoom);
                  setCameraRevision((value) => value + 1);
                }}
              ><Text style={styles.resetButtonText}>Focus active</Text></Pressable> : null}
              <Pressable
                accessibilityLabel="Reset canvas"
                accessibilityRole="button"
                onPress={resetCanvas}
                style={styles.resetButton}
                testID="blueprint-reset"
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          ) : null}

          <CanvasScrollSurface
            vertical={verticalScroll}
            horizontal={horizontalScroll}
            padding={hierarchy ? { paddingHorizontal: cameraPaddingX, paddingVertical: cameraPaddingY } : undefined}
            contentWidth={Math.max(workspaceSize.width, canvasSize.width * zoom + cameraPaddingX * 2)}
            contentHeight={Math.max(workspaceSize.height, canvasSize.height * zoom + cameraPaddingY * 2)}
            onPosition={setCameraPosition}
          >
              <View
                style={[
                  styles.canvasFrame,
                  {
                    width: canvasSize.width * zoom,
                    height: canvasSize.height * zoom,
                  },
                ]}
              >
                <View
                  ref={canvasSurface}
                  {...(Platform.OS !== 'web' ? nativeCanvasPan.panHandlers : {})}
                  testID="blueprint-canvas-surface"
                  style={[
                    styles.canvas,
                    {
                      width: canvasSize.width,
                      height: canvasSize.height,
                      left: -((canvasSize.width * (1 - zoom)) / 2),
                      top: -((canvasSize.height * (1 - zoom)) / 2),
                      transform: [{ scale: zoom }],
                    },
                  ]}
                >
                  {hierarchy ? (
                    <>
                      <FlowConnections boxes={hierarchy.boxes} links={connections} transition={navigationTransition} />
                      {effectiveArtboards.map((artboard) => {
                        const box = hierarchy.boxes[artboard.id];
                        return <View key={artboard.id} testID={`blueprint-position-${artboard.id}`} style={{ position: 'absolute', left: box.x, top: box.y, width: box.width, height: box.height }}>
                          <View style={styles.flowNodeHeading}>
                            <Text style={styles.flowNodeTitle}>{artboard.groupLabel ?? artboard.label}</Text>
                            <Text style={[styles.flowNodeBadge, artboard.metadata?.active ? styles.activeFlowNodeBadge : null]}>{artboard.metadata?.active ? 'ACTIVE' : artboard.placeholder ? 'PLACEHOLDER' : 'MOUNTED'}</Text>
                          </View>
                          {artboard.metadata?.active ? <View pointerEvents="none" style={styles.flowNodeHalo} /> : null}
                          <RuntimeArtboard
                            artboard={artboard}
                            store={inspectionStore}
                            inspecting={inspecting}
                            refreshKey={refreshKeys[artboard.id] ?? 0}
                            selected={artboard.id === activeSelectedArtboardId}
                            visible
                            onSelect={selectArtboard}
                            style={artboardStyle}
                            appearance="flow"
                          />
                          {[4, box.width - 16].map((left) => <View key={left} pointerEvents="none" testID={`blueprint-flow-port-${artboard.id}-${left === 4 ? 'in' : 'out'}`} style={[styles.flowPort, { left, top: box.height / 2 + 8 }, artboard.metadata?.active ? { borderColor: '#4dd9b4' } : null]}><View style={[styles.flowPortDot, artboard.metadata?.active ? { backgroundColor: '#4dd9b4' } : null]} /></View>)}
                        </View>;
                      })}
                    </>
                  ) : groups.map((group) => (
                    <View
                      key={group.id}
                      style={[
                        styles.group,
                        focused &&
                        selectedArtboard &&
                        !group.artboards.some(
                          (board) => board.id === selectedArtboard.id,
                        )
                          ? { display: 'none' }
                          : null,
                      ]}
                    >
                      {group.label ? (
                        <Text
                          style={styles.groupLabel}
                          testID={`blueprint-group-${group.id}`}
                        >
                          {group.label}
                        </Text>
                      ) : null}
                      <View style={styles.groupArtboards}>
                        {group.artboards.map((artboard) => (
                          <RuntimeArtboard
                            key={artboard.id}
                            artboard={artboard}
                            store={inspectionStore}
                            inspecting={inspecting}
                            refreshKey={refreshKeys[artboard.id] ?? 0}
                            selected={artboard.id === activeSelectedArtboardId}
                            visible={
                              !focused ||
                              !selectedArtboard ||
                              selectedArtboard.id === artboard.id
                            }
                            onSelect={selectArtboard}
                            style={artboardStyle}
                            appearance={artboardAppearance}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
          </CanvasScrollSurface>
        </View>
        {showInspector && inspectorOpen ? (
          <View
            style={
              rootWidth < 760
                ? {
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: Math.min(324, rootWidth),
                    zIndex: 3,
                  }
                : {}
            }
          >
            <BlueprintDetails
              onCollapse={() => setInspectorOpen(false)}
              inspecting={inspecting}
              pickRequest={pickRequest}
              configuration={inspection}
              board={selectedArtboard}
              store={inspectionStore}
              refresh={refreshScreen}
              refreshLabel={refreshLabel}
              onCopy={onCopy}
              onOpenSource={onOpenSource}
              devicePresets={BLUEPRINT_DEVICE_PRESETS}
              viewportOverridden={
                !!selectedArtboard && !!viewportOverrides[selectedArtboard.id]
              }
              onChangeViewport={(viewport) => {
                if (!selectedArtboard) return;
                const id = selectedArtboard.id;
                setViewportOverrides((current) => {
                  const next = { ...current };
                  if (viewport) next[id] = viewport;
                  else delete next[id];
                  return next;
                });
                setFitToCanvas(true);
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
    </BlueprintInspectionConfigurationProvider>
  );
}

/** Browsers must receive both scroll axes on one node to preserve diagonal gestures. */
function CanvasScrollSurface({ vertical, horizontal, padding, contentWidth, contentHeight, onPosition, children }: {
  vertical: React.RefObject<ScrollView>;
  horizontal: React.RefObject<ScrollView>;
  padding?: ViewStyle;
  contentWidth: number;
  contentHeight: number;
  onPosition?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  children: ReactNode;
}) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = vertical.current?.getScrollableNode?.() as HTMLElement | undefined;
    if (!node?.style) return;
    // RN Web's vertical ScrollView defaults to overflow-x:hidden. Enable both
    // axes on its public scroll node while retaining native browser momentum.
    const previous = { x: node.style.overflowX, y: node.style.overflowY, touch: node.style.touchAction };
    node.style.overflowX = 'auto';
    node.style.overflowY = 'auto';
    node.style.touchAction = 'pan-x pan-y';
    const detachDrag = attachBlueprintCanvasDrag(node);
    return () => {
      detachDrag();
      node.style.overflowX = previous.x;
      node.style.overflowY = previous.y;
      node.style.touchAction = previous.touch;
    };
  }, [vertical]);
  if (Platform.OS === 'web') return <ScrollView
    ref={vertical}
    testID="blueprint-canvas-scroll"
    style={styles.viewport}
    onScroll={onPosition ? (event) => {
      const { x, y } = event.nativeEvent.contentOffset;
      onPosition((position) => position.x === x && position.y === y ? position : { x, y });
    } : undefined}
    scrollEventThrottle={50}
    contentContainerStyle={[styles.horizontalContent, { width: contentWidth, height: contentHeight }, padding]}
  >{children}</ScrollView>;
  return <ScrollView
    ref={vertical}
    testID="blueprint-canvas-scroll-y"
    onScroll={onPosition ? (event) => { const y = event.nativeEvent.contentOffset.y; onPosition((position) => position.y === y ? position : { ...position, y }); } : undefined}
    scrollEventThrottle={50}
    nestedScrollEnabled
    style={styles.viewport}
    contentContainerStyle={styles.verticalContent}
  >
    <ScrollView
      ref={horizontal}
      testID="blueprint-canvas-scroll-x"
      onScroll={onPosition ? (event) => { const x = event.nativeEvent.contentOffset.x; onPosition((position) => position.x === x ? position : { ...position, x }); } : undefined}
      scrollEventThrottle={50}
      horizontal
      nestedScrollEnabled
      style={styles.horizontalViewport}
      contentContainerStyle={[styles.horizontalContent, padding]}
    >{children}</ScrollView>
  </ScrollView>;
}

// Keep canvas controls and panel state outside the profiled screen tree.
const RuntimeArtboard = memo(function RuntimeArtboard({
  artboard,
  store,
  inspecting,
  refreshKey,
  selected,
  visible,
  onSelect,
  style,
  appearance,
}: {
  artboard: BlueprintArtboardDefinition;
  store: InspectionStore;
  inspecting: boolean;
  refreshKey: number;
  selected: boolean;
  visible: boolean;
  onSelect(artboard: BlueprintArtboardDefinition): void;
  style?: StyleProp<ViewStyle>;
  appearance?: 'classic' | 'flow';
}) {
  const viewport = useMemo(
    () => resolveArtboardViewport(artboard),
    [artboard.viewport, artboard.width, artboard.height],
  );
  const pick = useCallback(() => onSelect(artboard), [onSelect, artboard]);
  const onRender = useCallback<React.ProfilerOnRenderCallback>(
    (id, phase, duration, baseDuration, startTime, commitTime) =>
      store.commit(id, duration, commitTime),
    [store],
  );
  const preview = useMemo(
    () => artboard.placeholder ? artboard.content : (
      <BlueprintInspectionProvider
        store={store}
        artboardId={artboard.id}
        inspecting={inspecting}
        viewport={viewport}
        onSelect={pick}
      >
        <Profiler key={refreshKey} id={artboard.id} onRender={onRender}>
          <BlueprintElementPicker>{artboard.content}</BlueprintElementPicker>
        </Profiler>
      </BlueprintInspectionProvider>
    ),
    [
      store,
      artboard.id,
      artboard.content,
      artboard.placeholder,
      inspecting,
      viewport,
      pick,
      refreshKey,
      onRender,
    ],
  );
  return (
    <BlueprintArtboard
      label={artboard.label}
      width={viewport.width}
      height={viewport.height}
      viewportName={viewport.name}
      selected={selected}
      appearance={appearance}
      flowStatus={artboard.placeholder ? 'placeholder' : (artboard.metadata?.active ?? selected) ? 'active' : 'mounted'}
      onPress={pick}
      style={[style, !visible ? { display: 'none' } : null]}
      testID={`blueprint-artboard-${artboard.id}`}
    >
      {preview}
    </BlueprintArtboard>
  );
});

type BlueprintArtboardGroup = {
  id: string;
  label?: string;
  artboards: readonly BlueprintArtboardDefinition[];
};

function groupArtboards(
  artboards: readonly BlueprintArtboardDefinition[],
): readonly BlueprintArtboardGroup[] {
  const groups = new Map<string, BlueprintArtboardGroup>();

  for (const artboard of artboards) {
    const groupId = artboard.groupId ?? '__ungrouped__';
    const existing = groups.get(groupId);

    if (existing) {
      groups.set(groupId, {
        ...existing,
        artboards: [...existing.artboards, artboard],
      });
      continue;
    }

    groups.set(groupId, {
      id: groupId,
      ...(artboard.groupLabel ? { label: artboard.groupLabel } : {}),
      artboards: [artboard],
    });
  }

  return [...groups.values()];
}

function measureCanvas(groups: readonly BlueprintArtboardGroup[]) {
  const groupSizes = groups.map((group) => {
    const artboardSizes = group.artboards.map((artboard) => {
      const viewport = resolveArtboardViewport(artboard);

      return {
        width: viewport.width + ARTBOARD_MARGIN * 2 + ARTBOARD_BORDER * 2,
        height:
          viewport.height +
          ARTBOARD_MARGIN * 2 +
          ARTBOARD_BORDER * 2 +
          ARTBOARD_HEADER_HEIGHT,
      };
    });

    return {
      width: artboardSizes.reduce((total, size) => total + size.width, 0),
      height:
        Math.max(0, ...artboardSizes.map(({ height }) => height)) +
        (group.label ? GROUP_LABEL_HEIGHT : 0),
    };
  });

  return {
    width:
      CANVAS_PADDING * 2 +
      groupSizes.reduce((total, size) => total + size.width, 0) +
      Math.max(0, groups.length - 1) * GROUP_GAP,
    height:
      CANVAS_PADDING * 2 +
      Math.max(0, ...groupSizes.map(({ height }) => height)),
  };
}

function calculateFitZoom(
  canvas: { width: number; height: number },
  workspace: { width: number; height: number },
  minZoom: number,
  maxZoom: number,
) {
  const availableWidth = Math.max(1, workspace.width - FIT_PADDING * 2);
  const availableHeight = Math.max(1, workspace.height - FIT_PADDING * 2);
  const widthZoom = availableWidth / Math.max(1, canvas.width);
  const heightZoom = availableHeight / Math.max(1, canvas.height);

  return clampBlueprintZoom(Math.min(widthZoom, heightZoom), minZoom, maxZoom);
}

function resolveArtboardViewport(
  artboard: BlueprintArtboardDefinition,
): BlueprintViewport {
  return {
    width: artboard.viewport?.width ?? artboard.width ?? DEFAULT_ARTBOARD_WIDTH,
    height:
      artboard.viewport?.height ?? artboard.height ?? DEFAULT_ARTBOARD_HEIGHT,
    ...(artboard.viewport?.name ? { name: artboard.viewport.name } : {}),
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1422',
  },
  workbenchToolbar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#142236',
    borderBottomWidth: 1,
    borderColor: '#2b3b50',
  },
  headerScroll: { height: 52, minHeight: 52, maxHeight: 52, flexGrow: 0, backgroundColor: '#142236' },
  workbenchStatus: { flex: 1, minWidth: 100, maxWidth: 380 },
  workbenchBrand: {
    color: '#4dd9b4',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  workbenchSubtitle: {
    color: '#879db5',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0,
  },
  workbenchActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  workbenchBody: { flex: 1, flexDirection: 'row' },
  canvasWorkspace: { flex: 1, minWidth: 100 },
  viewport: {
    flex: 1,
  },
  verticalContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  horizontalViewport: {
    alignSelf: 'stretch',
  },
  horizontalContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: FIT_PADDING,
  },
  canvasFrame: {
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    flexDirection: 'row',
    gap: GROUP_GAP,
    alignItems: 'flex-start',
    padding: CANVAS_PADDING,
  },
  group: {},
  groupLabel: {
    height: GROUP_LABEL_HEIGHT,
    marginHorizontal: ARTBOARD_MARGIN,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  groupArtboards: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  artboard: {
    margin: ARTBOARD_MARGIN,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#333333',
  },
  selectedArtboard: {
    borderColor: '#7aa2ff',
  },
  flowArtboard: { padding: 8, borderWidth: 2, borderRadius: 28, borderColor: '#3b526d', backgroundColor: '#152337' },
  activeFlowArtboard: { borderColor: '#4dd9b4' },
  placeholderFlowArtboard: { borderColor: '#344b64', borderStyle: 'dashed' },
  flowArtboardLabel: { backgroundColor: '#152337', color: '#d9e7f7', fontSize: 12, fontWeight: '600', padding: 0 },
  flowArtboardViewport: { backgroundColor: '#152337', color: '#708aa6', fontSize: 10, paddingTop: 3, paddingBottom: 0 },
  flowArtboardContent: { borderRadius: 16, overflow: 'hidden' },
  flowNodeHeading: { height: GROUP_LABEL_HEIGHT, marginHorizontal: ARTBOARD_MARGIN, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowNodeTitle: { flex: 1, color: '#d2e1f3', fontSize: 14, fontWeight: '600' },
  flowNodeBadge: { color: '#718aa4', fontSize: 8, fontWeight: '600', letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: '#172438' },
  activeFlowNodeBadge: { color: '#72e6c6', backgroundColor: '#163c3b' },
  flowNodeHalo: { position: 'absolute', left: 7, right: 7, top: 35, bottom: 7, borderRadius: 31, borderWidth: 1, borderColor: 'rgba(77,217,180,0.2)' },
  flowPort: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#59728e', backgroundColor: '#0b1422', alignItems: 'center', justifyContent: 'center' },
  flowPortDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7a93ae' },
  artboardLabel: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  artboardViewport: {
    backgroundColor: '#333333',
    color: '#d9d9d9',
    paddingBottom: 5,
    textAlign: 'center',
    fontSize: 11,
  },
  artboardContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerTab: { position: 'absolute', top: 64, zIndex: 4, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#1b3045', borderWidth: 1, borderColor: '#3b5872', borderRadius: 8 },
  drawerTabText: { color: '#d7e7f7', fontSize: 12, fontWeight: '600' },
  zoomControls: {
    position: 'absolute',
    zIndex: 1,
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1f1f1f',
    padding: 4,
  },
  zoomButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 22,
  },
  zoomValue: {
    minWidth: 52,
    color: '#ffffff',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  resetButton: {
    minHeight: 32,
    justifyContent: 'center',
    marginLeft: 4,
    paddingHorizontal: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
