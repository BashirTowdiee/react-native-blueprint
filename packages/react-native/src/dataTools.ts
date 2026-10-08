/** Safe, bounded representation for both searching and clipboard export. */
export function serializeBlueprintData(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    const json =
      JSON.stringify(
        value,
        (key, item) => {
          if (/password|secret|token|authorization|cookie/i.test(key))
            return '[Redacted]';
          if (typeof item === 'bigint') return String(item);
          if (typeof item === 'function') return '[Function]';
          if (typeof item === 'object' && item !== null) {
            if (seen.has(item)) return '[Circular]';
            seen.add(item);
          }
          return item;
        },
        2,
      ) ?? 'null';
    return json.length > 50000
      ? JSON.stringify(
          {
            notice: '[Truncated at 50,000 characters]',
            preview: json.slice(0, 12000),
          },
          null,
          2,
        )
      : json;
  } catch {
    return '[Data could not be serialised]';
  }
}

export type BlueprintValueChange = {
  path: string;
  kind: 'added' | 'removed' | 'changed';
  before: string;
  after: string;
};
export type BlueprintSnapshotDifference = {
  changes: readonly BlueprintValueChange[];
  truncated: boolean;
};
export function parseBlueprintSnapshot(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}
const MISSING = Symbol('missing');
function summarize(value: unknown): string {
  if (value === MISSING) return '[missing]';
  const result = JSON.stringify(value) ?? String(value);
  return result.length > 256
    ? result.slice(0, 256) + '… [value truncated]'
    : result;
}
/** Compare already-redacted serialized snapshots, with bounded work and output. */
export function compareBlueprintSnapshots(
  before: string,
  after: string,
): BlueprintSnapshotDifference {
  if (before === after) return { changes: [], truncated: false };
  const changes: BlueprintValueChange[] = [];
  let visited = 0;
  let truncated = false;
  function walk(left: unknown, right: unknown, path: string, depth: number) {
    if (++visited > 512 || changes.length >= 50) {
      truncated = true;
      return;
    }
    if (Object.is(left, right)) return;
    const objects =
      left !== null &&
      right !== null &&
      typeof left === 'object' &&
      typeof right === 'object';
    if (objects && Array.isArray(left) === Array.isArray(right) && depth < 8) {
      const l = left as Record<string, unknown>;
      const r = right as Record<string, unknown>;
      const keys = [...new Set([...Object.keys(l), ...Object.keys(r)])].sort();
      for (const key of keys) {
        if (visited > 512 || changes.length >= 50) {
          truncated = true;
          break;
        }
        walk(
          Object.prototype.hasOwnProperty.call(l, key) ? l[key] : MISSING,
          Object.prototype.hasOwnProperty.call(r, key) ? r[key] : MISSING,
          `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`,
          depth + 1,
        );
      }
      return;
    }
    const oldValue = summarize(left);
    const newValue = summarize(right);
    if (oldValue === newValue && left !== MISSING && right !== MISSING) {
      // Deep subtrees can have matching shortened summaries. Never infer equality
      // from truncation when the complete JSON differs.
      if (JSON.stringify(left) === JSON.stringify(right)) return;
    }
    if (depth >= 8) truncated = true;
    changes.push({
      path,
      kind:
        left === MISSING ? 'added' : right === MISSING ? 'removed' : 'changed',
      before: oldValue,
      after: newValue,
    });
  }
  walk(parseBlueprintSnapshot(before), parseBlueprintSnapshot(after), '', 0);
  return { changes, truncated };
}
