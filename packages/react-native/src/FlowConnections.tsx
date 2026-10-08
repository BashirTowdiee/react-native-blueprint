import React, { useEffect, useMemo } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import type { BlueprintFlowLink } from '@react-native-blueprint/core';
import type { FlowBox } from './flowLayout';
import { routeFlowConnection } from './flowRouting';

export type BlueprintFlowTransition = BlueprintFlowLink & { sequence: number };
type Point = { x: number; y: number };

function Line({
  points,
  color,
  thickness = 3.5,
}: {
  points: readonly Point[];
  color: string;
  thickness?: number;
}) {
  return (
    <>
      {points.slice(1).map((point, index) => {
        const before = points[index];
        const length = Math.hypot(point.x - before.x, point.y - before.y);
        const angle = Math.atan2(point.y - before.y, point.x - before.x);
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: (before.x + point.x) / 2 - length / 2,
              top: (before.y + point.y) / 2 - thickness / 2,
              height: thickness,
              width: length + 1,
              backgroundColor: color,
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
      })}
    </>
  );
}

function Arrow({ points, color }: { points: readonly Point[]; color: string }) {
  const end = points[points.length - 1];
  const before = points[points.length - 2];
  const right = end.x >= before.x;
  return (
    <View
      style={{
        position: 'absolute',
        left: right ? end.x - 10 : end.x,
        top: end.y - 6,
        width: 0,
        height: 0,
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderLeftWidth: 10,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
        transform: [{ rotate: right ? '0rad' : `${Math.PI}rad` }],
      }}
    />
  );
}

function Pulse({ points }: { points: readonly Point[] }) {
  const distances = points.map((_, index) =>
    index === 0
      ? 0
      : Math.hypot(
          points[index].x - points[index - 1].x,
          points[index].y - points[index - 1].y,
        ),
  );
  const totalDistance = distances.reduce((sum, length) => sum + length, 0);
  const progress = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: Math.min(1200, Math.max(650, totalDistance * 0.7)),
          useNativeDriver: true,
        }),
        Animated.delay(100),
      ]),
      { iterations: 3 },
    );
    let disposed = false;
    animation.start();
    const reduce = (enabled: boolean) => {
      if (enabled) {
        animation.stop();
        progress.setValue(1);
      }
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!disposed) reduce(enabled);
      })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      reduce,
    );
    return () => {
      disposed = true;
      animation.stop();
      listener.remove();
    };
  }, [progress, totalDistance]);
  let traveled = 0;
  const inputRange = distances.map((length) => {
    traveled += length;
    return traveled / totalDistance;
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });
  return (
    <>
      <View
        testID="blueprint-flow-active-link"
        accessibilityLabel="Active navigation connection"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            opacity: progress.interpolate({
              inputRange: [0, 0.1, 0.85, 1],
              outputRange: [0.12, 0.4, 0.4, 0.12],
            }),
          }}
        >
          <Line points={points} color="#4dd9b4" thickness={10} />
        </Animated.View>
        <Line points={points} color="#65e9c5" thickness={5} />
        <Arrow points={points} color="#65e9c5" />
      </View>
      <Animated.View
        testID="blueprint-flow-pulse"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#b5ffee',
          opacity,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange,
                outputRange: points.map((point) => point.x - 5),
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange,
                outputRange: points.map((point) => point.y - 5),
              }),
            },
          ],
        }}
      />
    </>
  );
}

export function FlowConnections({
  boxes,
  links,
  transition,
}: {
  boxes: Record<string, FlowBox>;
  links: readonly BlueprintFlowLink[];
  transition?: BlueprintFlowTransition;
}) {
  const paths = useMemo(
    () =>
      links.flatMap((link) => {
        if (!boxes[link.from] || !boxes[link.to]) return [];
        const points = routeFlowConnection(
          boxes[link.from],
          boxes[link.to],
          Object.values(boxes),
        );
        return points.length ? [{ ...link, points }] : [];
      }),
    [boxes, links],
  );
  const pulsePoints = useMemo(() => {
    if (!transition || !boxes[transition.from] || !boxes[transition.to])
      return undefined;
    const direct = paths.find(
      (link) => link.from === transition.from && link.to === transition.to,
    );
    if (direct) return direct.points;
    const inverse = paths.find(
      (link) => link.from === transition.to && link.to === transition.from,
    );
    if (inverse) return [...inverse.points].reverse();
    const points = routeFlowConnection(
      boxes[transition.from],
      boxes[transition.to],
      Object.values(boxes),
    );
    return points.length ? points : undefined;
  }, [paths, boxes, transition]);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      testID="blueprint-flow-connections"
    >
      {Array.from(
        {
          length: Math.ceil(
            Math.max(
              0,
              ...Object.values(boxes).map((box) => box.x + box.width),
            ) / 160,
          ),
        },
        (_, index) => (
          <View
            key={`column-${index}`}
            style={{
              position: 'absolute',
              left: index * 160,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: '#172638',
              opacity: 0.5,
            }}
          />
        ),
      )}
      {Array.from(
        {
          length: Math.ceil(
            Math.max(
              0,
              ...Object.values(boxes).map((box) => box.y + box.height),
            ) / 160,
          ),
        },
        (_, index) => (
          <View
            key={`row-${index}`}
            style={{
              position: 'absolute',
              top: index * 160,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: '#172638',
              opacity: 0.5,
            }}
          />
        ),
      )}
      {paths.map((link) => (
        <View
          key={JSON.stringify([link.from, link.to])}
          testID={`blueprint-flow-link-${link.from}-${link.to}`}
        >
          <Line points={link.points} color="#57708b" />
          <Arrow points={link.points} color="#57708b" />
        </View>
      ))}
      {pulsePoints ? (
        <Pulse key={transition!.sequence} points={pulsePoints} />
      ) : null}
    </View>
  );
}
