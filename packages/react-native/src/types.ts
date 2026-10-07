import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type BlueprintArtboard = {
  id: string;
  label: string;
  render: () => React.ReactNode;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export type BlueprintViewProps = {
  artboards: readonly BlueprintArtboard[];
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  showControls?: boolean;
  style?: StyleProp<ViewStyle>;
  workspaceStyle?: StyleProp<ViewStyle>;
  canvasStyle?: StyleProp<ViewStyle>;
  onScaleChange?: (scale: number) => void;
};
