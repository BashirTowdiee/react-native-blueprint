import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BlueprintArtboard as BlueprintArtboardDefinition } from './types';

export const DEFAULT_ARTBOARD_WIDTH = 375;
export const DEFAULT_ARTBOARD_HEIGHT = 667;

type BlueprintArtboardProps = {
  artboard: BlueprintArtboardDefinition;
};

export function BlueprintArtboard({ artboard }: BlueprintArtboardProps) {
  const width = artboard.width ?? DEFAULT_ARTBOARD_WIDTH;
  const height = artboard.height ?? DEFAULT_ARTBOARD_HEIGHT;

  return (
    <View
      testID={`blueprint-artboard-${artboard.id}`}
      style={[
        styles.frame,
        {
          width,
          height,
        },
        artboard.style,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.label}>{artboard.label}</Text>
      </View>
      <View
        testID={`blueprint-artboard-content-${artboard.id}`}
        style={styles.content}
      >
        {artboard.render()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#333333',
  },
  header: {
    backgroundColor: '#333333',
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  label: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
