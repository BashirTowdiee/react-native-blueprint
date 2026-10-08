import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BlueprintInspectionEvent } from './inspection';
import type {
  BlueprintSnapshotDifference,
  BlueprintValueChange,
} from './dataTools';

export function SnapshotComparison({
  difference,
  pinnedAt,
}: {
  difference: BlueprintSnapshotDifference;
  pinnedAt: number;
}) {
  return (
    <View testID="blueprint-snapshot-comparison" style={styles.section}>
      <Text style={styles.title}>Changes since saved data</Text>
      <Text style={styles.muted}>
        Saved at {new Date(pinnedAt).toLocaleTimeString()} ·{' '}
        {difference.changes.length} changed fields
      </Text>
      {!difference.changes.length && !difference.truncated ? (
        <Text style={styles.muted}>No changes since saving this data.</Text>
      ) : null}
      <ChangeValues changes={difference.changes} />
      {difference.truncated ? (
        <Text style={styles.muted}>
          Comparison is limited to 50 changes, 512 nodes and 8 levels. Some
          differences may be omitted.
        </Text>
      ) : null}
    </View>
  );
}
function ChangeValues({
  changes,
}: {
  changes: readonly BlueprintValueChange[];
}) {
  return (
    <>
      {changes.map((change, index) => (
        <View key={`${change.path}:${index}`} style={styles.change}>
          <Text selectable style={styles.path}>
            {change.path || '(root)'} · {change.kind}
          </Text>
          <Text selectable style={styles.before}>
            − {change.before}
          </Text>
          <Text selectable style={styles.after}>
            + {change.after}
          </Text>
        </View>
      ))}
    </>
  );
}
export function InspectionHistory({
  events,
  selectedComponentId,
  selectedOnly,
  toggleFilter,
  clear,
}: {
  events: readonly BlueprintInspectionEvent[];
  selectedComponentId?: string;
  selectedOnly: boolean;
  toggleFilter(): void;
  clear(): void;
}) {
  const visible = selectedOnly
    ? events.filter(
        (event) =>
          event.componentId === selectedComponentId || event.kind === 'refresh',
      )
    : events;
  return (
    <View testID="blueprint-change-history" style={styles.section}>
      <Text style={styles.title}>Exposed data changes</Text>
      <Text style={styles.muted}>
        Latest 30 events in this preview. Changes reflect exposed data, not a
        trace of which hook caused a render.
      </Text>
      <View style={styles.row}>
        {selectedComponentId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectedOnly
                ? 'Show all component changes'
                : 'Show selected component changes'
            }
            onPress={toggleFilter}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {selectedOnly ? 'All components' : 'Selected component'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear change history"
          testID="blueprint-clear-history"
          onPress={clear}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Clear history</Text>
        </Pressable>
      </View>
      {!visible.length ? (
        <Text style={styles.muted}>
          No changes recorded. Interact with the preview to change its exposed
          data.
        </Text>
      ) : null}
      {visible.map((event) => (
        <View key={event.id} style={styles.event}>
          <Text style={styles.title}>
            {event.kind === 'refresh'
              ? 'Preview refreshed'
              : event.componentName}
          </Text>
          <Text style={styles.muted}>
            {new Date(event.at).toLocaleTimeString()} ·{' '}
            {event.kind === 'data'
              ? `${event.changes.length} changed fields`
              : 'Local preview state reset'}
          </Text>
          <ChangeValues changes={event.changes} />
          {event.truncated ? (
            <Text style={styles.muted}>Event details were truncated.</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 10, marginVertical: 12 },
  title: { color: '#e8f2ff', fontSize: 13, fontWeight: '600' },
  muted: { color: '#8ea4bc', fontSize: 11, lineHeight: 17 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { backgroundColor: '#24354a', padding: 8, borderRadius: 5 },
  buttonText: { color: '#edf5ff', fontSize: 11 },
  event: { padding: 10, backgroundColor: '#0b1422', borderRadius: 6, gap: 8 },
  change: { gap: 3, marginVertical: 5 },
  path: { color: '#b7ccea', fontSize: 11, fontFamily: 'monospace' },
  before: { color: '#f1b6b6', fontSize: 11, lineHeight: 17 },
  after: { color: '#aee8d9', fontSize: 11, lineHeight: 17 },
});
