import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlueprintArtboardFrame } from './BlueprintArtboard';
import type { BlueprintViewProps } from './types';
import {
  clampBlueprintScale,
  DEFAULT_INITIAL_SCALE,
  DEFAULT_MAX_SCALE,
  DEFAULT_MIN_SCALE,
  DEFAULT_ZOOM_STEP,
  getNextBlueprintScale,
  validateBlueprintZoomRange,
} from './zoom';

type WheelEventLike = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  deltaY: number;
  preventDefault: () => void;
};

type WheelTarget = {
  addEventListener: (
    type: 'wheel',
    listener: (event: WheelEventLike) => void,
    options?: { passive?: boolean },
  ) => void;
  removeEventListener: (
    type: 'wheel',
    listener: (event: WheelEventLike) => void,
  ) => void;
};

export function BlueprintView({
  artboards,
  initialScale = DEFAULT_INITIAL_SCALE,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  zoomStep = DEFAULT_ZOOM_STEP,
  showControls = true,
  style,
  workspaceStyle,
  canvasStyle,
  onScaleChange,
}: BlueprintViewProps) {
  validateBlueprintZoomRange(minScale, maxScale);

  if (!Number.isFinite(zoomStep) || zoomStep <= 0) {
    throw new RangeError('Blueprint zoomStep must be a finite number greater than 0.');
  }

  const rootRef = useRef<View>(null);
  const [scale, setScale] = useState(() =>
    clampBlueprintScale(initialScale, minScale, maxScale),
  );

  const commitScale = useCallback(
    (nextScale: number) => {
      const clamped = clampBlueprintScale(nextScale, minScale, maxScale);
      setScale(clamped);
      onScaleChange?.(clamped);
    },
    [maxScale, minScale, onScaleChange],
  );

  const zoom = useCallback(
    (direction: 'in' | 'out') => {
      setScale((currentScale) => {
        const nextScale = getNextBlueprintScale(currentScale, direction, {
          minScale,
          maxScale,
          step: zoomStep,
        });
        onScaleChange?.(nextScale);
        return nextScale;
      });
    },
    [maxScale, minScale, onScaleChange, zoomStep],
  );

  const resetZoom = useCallback(() => {
    commitScale(initialScale);
  }, [commitScale, initialScale]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const target = rootRef.current as unknown as WheelTarget | null;
    if (!target?.addEventListener) {
      return;
    }

    const handleWheel = (event: WheelEventLike) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      zoom(event.deltaY < 0 ? 'in' : 'out');
    };

    target.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      target.removeEventListener('wheel', handleWheel);
    };
  }, [zoom]);

  return (
    <View
      ref={rootRef}
      testID="blueprint-view"
      style={[styles.root, style]}
    >
      {showControls ? (
        <View style={styles.controls} testID="blueprint-zoom-controls">
          <Pressable
            accessibilityLabel="Zoom out"
            testID="blueprint-zoom-out"
            onPress={() => zoom('out')}
            style={styles.controlButton}
          >
            <Text style={styles.controlText}>−</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Reset zoom"
            testID="blueprint-zoom-reset"
            onPress={resetZoom}
            style={styles.scaleButton}
          >
            <Text style={styles.scaleText}>{Math.round(scale * 100)}%</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Zoom in"
            testID="blueprint-zoom-in"
            onPress={() => zoom('in')}
            style={styles.controlButton}
          >
            <Text style={styles.controlText}>+</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.verticalScroller}
        contentContainerStyle={styles.verticalContent}
      >
        <ScrollView
          horizontal
          contentContainerStyle={[styles.workspace, workspaceStyle]}
        >
          <View
            testID="blueprint-canvas"
            style={[
              styles.canvas,
              {
                transform: [{ scale }],
                transformOrigin: 'top left',
              },
              canvasStyle,
            ]}
          >
            {artboards.map((artboard) => (
              <BlueprintArtboardFrame key={artboard.id} artboard={artboard} />
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
    backgroundColor: '#333333',
    position: 'relative',
  },
  verticalScroller: {
    flex: 1,
  },
  verticalContent: {
    flexGrow: 1,
  },
  workspace: {
    flexGrow: 1,
    alignItems: 'flex-start',
  },
  canvas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    padding: 20,
  },
  controls: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#1f1f1f',
    overflow: 'hidden',
  },
  controlButton: {
    minWidth: 36,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButton: {
    minWidth: 56,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#555555',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 22,
  },
  scaleText: {
    color: '#ffffff',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
