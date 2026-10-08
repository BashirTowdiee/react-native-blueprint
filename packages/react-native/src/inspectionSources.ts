import type { BlueprintSourceLocation } from './inspection';

export type BlueprintInspectionMethod = 'automatic' | 'config' | 'wrapper';
export type BlueprintElementMetadata = {
  name: string;
  host: string;
  location: BlueprintSourceLocation;
};
export type BlueprintInspectionMapping = {
  id: string;
  /** All supplied fields must match. Labels can use a prefix for repeated controls. */
  match: {
    testID?: string;
    accessibilityLabel?: string | { prefix: string };
    componentName?: string;
    host?: string;
  };
  name: string;
  sourceLocation?: BlueprintSourceLocation;
  /** Optional app-owned values. Never reads hidden React state. */
  data?: unknown;
};
export type BlueprintDevToolsStatus = 'waiting' | 'connected' | 'disconnected' | 'unavailable';
export type BlueprintDevToolsConnection = {
  subscribe(listener: () => void): () => void;
  getSnapshot(): BlueprintDevToolsStatus;
  open(): void;
};
export type BlueprintInspectionConfiguration = {
  /** Provenance supplied by the application's pinned release manifest. */
  release?: { sourceCommit: string; channel?: string };
  automatic?: boolean;
  mappings?: readonly BlueprintInspectionMapping[];
  devTools?: BlueprintDevToolsConnection;
};

export function matchBlueprintInspectionMapping(
  mappings: readonly BlueprintInspectionMapping[] = [],
  metadata: BlueprintElementMetadata,
  props: { testID?: string; accessibilityLabel?: string },
) {
  return mappings.find(({ match }) => {
    if (!Object.keys(match).length) return false;
    const label = match.accessibilityLabel;
    return (match.testID === undefined || match.testID === props.testID) &&
      (match.componentName === undefined || match.componentName === metadata.name) &&
      (match.host === undefined || match.host === metadata.host) &&
      (label === undefined || (typeof label === 'string' ? label === props.accessibilityLabel : props.accessibilityLabel?.startsWith(label.prefix)));
  });
}
