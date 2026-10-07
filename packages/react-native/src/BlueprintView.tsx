import React, {
  type ReactNode,
  useCallback,
  useEffect,
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

import {
  clampBlueprintZoom,
  DEFAULT_BLUEPRINT_MAX_ZOOM,
  DEFAULT_BLUEPRINT_MIN_ZOOM,
  DEFAULT_BLUEPRINT_ZOOM_STEP,
} from './zoom';

const DEFAULT_ARTBOARD_WIDTH = 375;
const DEFAULT_ARTBOARD_HEIGHT = 667;

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
  width?: number;
  height?: number;
};

export type BlueprintArtboardProps = {
  label: string;
  children: ReactNode;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function BlueprintArtboard({
  label,
  children,
  width = DEFAULT_ARTBOARD_WIDTH,
  height = DEFAULT_ARTBOARD_HEIGHT,
  style,
  testID,
}: BlueprintArtboardProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.artboard,
        {
          width,
          height,
        },
        style,
      ]}
    >
      <Text style={styles.artboardLabel}>{label}</Text>
      <View style={styles.artboardContent}>{children}</View>
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
  style?: StyleProp<ViewStyle>;
  artboardStyle?: StyleProp<ViewStyle>;
  onZoomChange?: (zoom: number) => void;
};

export function BlueprintView({
  artboards,
  initialZoom = 0.5,
  minZoom = DEFAULT_BLUEPRINT_MIN_ZOOM,
  maxZoom = DEFAULT_BLUEPRINT_MAX_ZOOM,
  zoomStep = DEFAULT_BLUEPRINT_ZOOM_STEP,
  showZoomControls = true,
  style,
  artboardStyle,
  onZoomChange,
}: BlueprintViewProps) {
  const [zoom, setZoomState] = useState(() =>
    clampBlueprintZoom(initialZoom, minZoom, maxZoom),
  );
  const workspaceRef = useRef<View>(null);

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
            {artboards.map((artboard) => (
              <BlueprintArtboard
                key={artboard.id}
                label={artboard.label}
                width={artboard.width}
                height={artboard.height}
                style={artboardStyle}
                testID={`blueprint-artboard-${artboard.id}`}
              >
                {artboard.content}
              </BlueprintArtboard>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    padding: 20,
  },
  artboard: {
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#333333',
  },
  artboardLabel: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 5,
    textAlign: 'center',
    fontWeight: 'bold',
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
});
