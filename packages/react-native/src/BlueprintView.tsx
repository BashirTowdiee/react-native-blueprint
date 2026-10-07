import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
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
} from '@react-native-blueprint/core';

import {
  clampBlueprintZoom,
  DEFAULT_BLUEPRINT_MAX_ZOOM,
  DEFAULT_BLUEPRINT_MIN_ZOOM,
  DEFAULT_BLUEPRINT_ZOOM_STEP,
} from './zoom';

const DEFAULT_ARTBOARD_WIDTH = 375;
const DEFAULT_ARTBOARD_HEIGHT = 667;

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
}: BlueprintArtboardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={[
        styles.artboard,
        selected ? styles.selectedArtboard : null,
        {
          width,
          height,
        },
        style,
      ]}
    >
      <Text style={styles.artboardLabel}>{label}</Text>
      <Text
        style={styles.artboardViewport}
        testID={testID ? `${testID}-viewport` : undefined}
      >
        {[
          viewportName,
          `${width} × ${height}`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <View style={styles.artboardContent}>{children}</View>
    </Pressable>
  );
}

export type BlueprintViewProps = {
  artboards: readonly BlueprintArtboardDefinition[];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  showZoomControls?: boolean;
  showInspector?: boolean;
  selectedArtboardId?: string;
  defaultSelectedArtboardId?: string;
  style?: StyleProp<ViewStyle>;
  artboardStyle?: StyleProp<ViewStyle>;
  onZoomChange?: (zoom: number) => void;
  onSelectArtboard?: (
    artboard: BlueprintArtboardDefinition | undefined,
  ) => void;
};

export function BlueprintView({
  artboards,
  initialZoom = 0.5,
  minZoom = DEFAULT_BLUEPRINT_MIN_ZOOM,
  maxZoom = DEFAULT_BLUEPRINT_MAX_ZOOM,
  zoomStep = DEFAULT_BLUEPRINT_ZOOM_STEP,
  showZoomControls = true,
  showInspector = true,
  selectedArtboardId,
  defaultSelectedArtboardId,
  style,
  artboardStyle,
  onZoomChange,
  onSelectArtboard,
}: BlueprintViewProps) {
  const [zoom, setZoomState] = useState(() =>
    clampBlueprintZoom(initialZoom, minZoom, maxZoom),
  );
  const [internalSelectedArtboardId, setInternalSelectedArtboardId] =
    useState(defaultSelectedArtboardId);
  const workspaceRef = useRef<View>(null);
  const activeSelectedArtboardId =
    selectedArtboardId ?? internalSelectedArtboardId;
  const selectedArtboard = artboards.find(
    ({ id }) => id === activeSelectedArtboardId,
  );
  const groups = useMemo(() => groupArtboards(artboards), [artboards]);

  const setZoom = useCallback(
    (nextZoom: number | ((currentZoom: number) => number)) => {
      setZoomState((currentZoom) => {
        const requestedZoom =
          typeof nextZoom === 'function' ? nextZoom(currentZoom) : nextZoom;
        const boundedZoom = clampBlueprintZoom(
          requestedZoom,
          minZoom,
          maxZoom,
        );

        if (boundedZoom !== currentZoom) {
          onZoomChange?.(boundedZoom);
        }

        return boundedZoom;
      });
    },
    [maxZoom, minZoom, onZoomChange],
  );

  const zoomIn = useCallback(() => {
    setZoom((currentZoom) => currentZoom + zoomStep);
  }, [setZoom, zoomStep]);

  const zoomOut = useCallback(() => {
    setZoom((currentZoom) => currentZoom - zoomStep);
  }, [setZoom, zoomStep]);

  const selectArtboard = useCallback(
    (artboard: BlueprintArtboardDefinition | undefined) => {
      if (selectedArtboardId === undefined) {
        setInternalSelectedArtboardId(artboard?.id);
      }
      onSelectArtboard?.(artboard);
    },
    [onSelectArtboard, selectedArtboardId],
  );

  const resetCanvas = useCallback(() => {
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
      setZoom((currentZoom) =>
        event.deltaY < 0
          ? currentZoom + zoomStep
          : currentZoom - zoomStep,
      );
    },
    [setZoom, zoomStep],
  );

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
    <View ref={workspaceRef} style={[styles.root, style]}>
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

      <ScrollView
        nestedScrollEnabled
        style={styles.viewport}
        contentContainerStyle={styles.verticalContent}
      >
        <ScrollView
          horizontal
          nestedScrollEnabled
          contentContainerStyle={styles.horizontalContent}
        >
          <View
            style={[
              styles.canvas,
              {
                transform: [{ scale: zoom }],
              },
            ]}
          >
            {groups.map((group) => (
              <View key={group.id} style={styles.group}>
                {group.label ? (
                  <Text
                    style={styles.groupLabel}
                    testID={`blueprint-group-${group.id}`}
                  >
                    {group.label}
                  </Text>
                ) : null}
                <View style={styles.groupArtboards}>
                  {group.artboards.map((artboard) => {
                    const viewport = resolveArtboardViewport(artboard);

                    return (
                      <BlueprintArtboard
                        key={artboard.id}
                        label={artboard.label}
                        width={viewport.width}
                        height={viewport.height}
                        viewportName={viewport.name}
                        selected={artboard.id === activeSelectedArtboardId}
                        onPress={() => selectArtboard(artboard)}
                        style={artboardStyle}
                        testID={`blueprint-artboard-${artboard.id}`}
                      >
                        {artboard.content}
                      </BlueprintArtboard>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {showInspector && selectedArtboard ? (
        <BlueprintInspector artboard={selectedArtboard} />
      ) : null}
    </View>
  );
}

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

function resolveArtboardViewport(
  artboard: BlueprintArtboardDefinition,
): BlueprintViewport {
  return {
    width:
      artboard.viewport?.width ??
      artboard.width ??
      DEFAULT_ARTBOARD_WIDTH,
    height:
      artboard.viewport?.height ??
      artboard.height ??
      DEFAULT_ARTBOARD_HEIGHT,
    ...(artboard.viewport?.name
      ? { name: artboard.viewport.name }
      : {}),
  };
}

function BlueprintInspector({
  artboard,
}: {
  artboard: BlueprintArtboardDefinition;
}) {
  const viewport = resolveArtboardViewport(artboard);

  return (
    <View
      style={styles.inspector}
      testID={`blueprint-inspector-${artboard.id}`}
    >
      <Text style={styles.inspectorTitle}>{artboard.label}</Text>
      <Text style={styles.inspectorViewport}>
        {[
          viewport.name,
          `${viewport.width} × ${viewport.height}`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {artboard.metadata ? (
        <Text
          style={styles.inspectorMetadata}
          testID="blueprint-inspector-metadata"
        >
          {formatMetadata(artboard.metadata)}
        </Text>
      ) : null}
    </View>
  );
}

function formatMetadata(metadata: BlueprintMetadata): string {
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return '[Metadata could not be serialised]';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2b2b2b',
  },
  viewport: {
    flex: 1,
  },
  verticalContent: {
    flexGrow: 1,
  },
  horizontalContent: {
    flexGrow: 1,
    alignItems: 'flex-start',
  },
  canvas: {
    alignItems: 'flex-start',
    padding: 20,
  },
  group: {
    marginBottom: 20,
  },
  groupLabel: {
    marginHorizontal: 10,
    marginBottom: 8,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupArtboards: {
    maxWidth: 1600,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  artboard: {
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#333333',
  },
  selectedArtboard: {
    borderColor: '#7aa2ff',
  },
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
  inspector: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 300,
    maxHeight: 240,
    borderRadius: 8,
    backgroundColor: '#1f1f1f',
    padding: 12,
  },
  inspectorTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inspectorViewport: {
    marginTop: 4,
    color: '#d9d9d9',
    fontSize: 12,
  },
  inspectorMetadata: {
    marginTop: 8,
    color: '#d9d9d9',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
  },
});
