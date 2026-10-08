import type { BlueprintArtboardDefinition } from './BlueprintView';

export type FlowBox = { x: number; y: number; width: number; height: number };
const PADDING = 40;
const COLUMN_GAP = 160;
const ROW_GAP = 64;

/** Depth increases rightward; every peer at a depth has its own vertical row. */
export function layoutBlueprintHierarchy(
  artboards: readonly BlueprintArtboardDefinition[],
) {
  const depths = new Map<string, number>();
  const lookup = new Map(artboards.map((board) => [board.id, board]));
  function depth(id: string, ancestors = new Set<string>()): number {
    if (depths.has(id)) return depths.get(id)!;
    if (ancestors.has(id)) throw new Error(`Cyclic artboard hierarchy: ${id}`);
    const board = lookup.get(id);
    const next = new Set(ancestors).add(id);
    const value =
      board?.parentArtboardId && lookup.has(board.parentArtboardId)
        ? depth(board.parentArtboardId, next) + 1
        : 0;
    depths.set(id, value);
    return value;
  }
  const columns: BlueprintArtboardDefinition[][] = [];
  for (const board of artboards) (columns[depth(board.id)] ??= []).push(board);
  const size = (board: BlueprintArtboardDefinition) => ({
    // Artboard content + border/header + margin + the screen label above it.
    width: (board.viewport?.width ?? board.width ?? 375) + 40,
    height: (board.viewport?.height ?? board.height ?? 667) + 116,
  });
  const heights = columns.map(
    (column) =>
      column.reduce((sum, board) => sum + size(board).height, 0) +
      Math.max(0, column.length - 1) * ROW_GAP,
  );
  const contentHeight = Math.max(0, ...heights);
  const boxes: Record<string, FlowBox> = {};
  let x = PADDING;
  columns.forEach((column, index) => {
    let y = PADDING + (contentHeight - heights[index]) / 2;
    const width = Math.max(0, ...column.map((board) => size(board).width));
    for (const board of column) {
      const dimensions = size(board);
      boxes[board.id] = {
        x: x + (width - dimensions.width) / 2,
        y,
        ...dimensions,
      };
      y += dimensions.height + ROW_GAP;
    }
    x += width + COLUMN_GAP;
  });
  return {
    boxes,
    width: Math.max(80, x - COLUMN_GAP + PADDING),
    height: contentHeight + PADDING * 2,
  };
}

export function flowConnectionPoints(from: FlowBox, to: FlowBox, steps = 24) {
  const start = {
    x: from.x + from.width - 10,
    y: from.y + from.height / 2 + 14,
  };
  const end = { x: to.x + 10, y: to.y + to.height / 2 + 14 };
  const reach = Math.max(60, Math.abs(end.x - start.x) / 2);
  const a = { x: start.x + reach, y: start.y };
  const b = { x: end.x - reach, y: end.y };
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const u = 1 - t;
    return {
      x:
        u ** 3 * start.x +
        3 * u ** 2 * t * a.x +
        3 * u * t ** 2 * b.x +
        t ** 3 * end.x,
      y:
        u ** 3 * start.y +
        3 * u ** 2 * t * a.y +
        3 * u * t ** 2 * b.y +
        t ** 3 * end.y,
    };
  });
}
