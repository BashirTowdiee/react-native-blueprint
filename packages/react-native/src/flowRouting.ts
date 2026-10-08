import type { FlowBox } from './flowLayout';

export type FlowPoint = { x: number; y: number };
type Obstacle = { left: number; right: number; top: number; bottom: number };
const CLEARANCE = 24;

/** Screen frames, including their headings, are obstacles for every connection. */
export function flowObstacle(box: FlowBox): Obstacle {
  return {
    left: box.x + 10 - CLEARANCE,
    right: box.x + box.width - 10 + CLEARANCE,
    top: box.y - CLEARANCE,
    bottom: box.y + box.height - 10 + CLEARANCE,
  };
}

export function flowSegmentIntersectsBox(
  a: FlowPoint,
  b: FlowPoint,
  box: FlowBox,
) {
  const left = box.x + 10;
  const right = box.x + box.width - 10;
  const top = box.y + 28 + 10;
  const bottom = box.y + box.height - 10;
  // Slab intersection works for the rounded-corner samples as well as straight lines.
  let enter = 0;
  let leave = 1;
  for (const [start, delta, low, high] of [
    [a.x, b.x - a.x, left + 0.01, right - 0.01],
    [a.y, b.y - a.y, top + 0.01, bottom - 0.01],
  ]) {
    if (Math.abs(delta) < 0.0001) {
      if (start <= low || start >= high) return false;
    } else {
      const first = (low - start) / delta;
      const second = (high - start) / delta;
      enter = Math.max(enter, Math.min(first, second));
      leave = Math.min(leave, Math.max(first, second));
      if (enter > leave) return false;
    }
  }
  return enter <= leave;
}

function blocked(a: FlowPoint, b: FlowPoint, obstacles: readonly Obstacle[]) {
  return obstacles.some((box) =>
    a.x === b.x
      ? a.x > box.left &&
        a.x < box.right &&
        Math.max(a.y, b.y) > box.top &&
        Math.min(a.y, b.y) < box.bottom
      : a.y > box.top &&
        a.y < box.bottom &&
        Math.max(a.x, b.x) > box.left &&
        Math.min(a.x, b.x) < box.right,
  );
}

function rounded(points: readonly FlowPoint[]) {
  const simple: FlowPoint[] = [];
  for (const point of points) {
    const a = simple[simple.length - 2];
    const b = simple[simple.length - 1];
    if (
      a &&
      b &&
      ((a.x === b.x && b.x === point.x) || (a.y === b.y && b.y === point.y))
    )
      simple.pop();
    if (
      !simple.length ||
      simple[simple.length - 1].x !== point.x ||
      simple[simple.length - 1].y !== point.y
    )
      simple.push(point);
  }
  const result = [simple[0]];
  for (let index = 1; index < simple.length - 1; index++) {
    const previous = simple[index - 1];
    const corner = simple[index];
    const next = simple[index + 1];
    const before = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const after = Math.hypot(next.x - corner.x, next.y - corner.y);
    const radius = Math.min(20, before / 2, after / 2);
    const entry = {
      x: corner.x - ((corner.x - previous.x) * radius) / before,
      y: corner.y - ((corner.y - previous.y) * radius) / before,
    };
    const exit = {
      x: corner.x + ((next.x - corner.x) * radius) / after,
      y: corner.y + ((next.y - corner.y) * radius) / after,
    };
    result.push(entry);
    for (let step = 1; step <= 8; step++) {
      const t = step / 8;
      result.push({
        x:
          (1 - t) ** 2 * entry.x + 2 * (1 - t) * t * corner.x + t ** 2 * exit.x,
        y:
          (1 - t) ** 2 * entry.y + 2 * (1 - t) * t * corner.y + t ** 2 * exit.y,
      });
    }
  }
  result.push(simple[simple.length - 1]);
  return result.filter(
    (point, index) =>
      index === 0 ||
      Math.hypot(point.x - result[index - 1].x, point.y - result[index - 1].y) >
        0.001,
  );
}

/** Rectilinear A* routes through free channels, then rounds the corners. */
export function routeFlowConnection(
  from: FlowBox,
  to: FlowBox,
  boxes: readonly FlowBox[],
): FlowPoint[] {
  const source = {
    x: from.x + from.width - 10,
    y: from.y + from.height / 2 + 14,
  };
  const destination = { x: to.x + 10, y: to.y + to.height / 2 + 14 };
  const start = { x: source.x + CLEARANCE + 1, y: source.y };
  const finish = { x: destination.x - CLEARANCE - 1, y: destination.y };
  const obstacles = boxes.map(flowObstacle);
  const xs = [
    ...new Set([
      start.x,
      finish.x,
      ...obstacles.flatMap((box) => [box.left - 1, box.right + 1]),
    ]),
  ].sort((a, b) => a - b);
  const ys = [
    ...new Set([
      start.y,
      finish.y,
      ...obstacles.flatMap((box) => [box.top - 1, box.bottom + 1]),
    ]),
  ].sort((a, b) => a - b);
  const key = (x: number, y: number) => y * xs.length + x;
  const point = (id: number) => ({
    x: xs[id % xs.length],
    y: ys[Math.floor(id / xs.length)],
  });
  const first = key(xs.indexOf(start.x), ys.indexOf(start.y));
  const last = key(xs.indexOf(finish.x), ys.indexOf(finish.y));
  const distance = (a: FlowPoint, b: FlowPoint) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const costs = new Map([[first, 0]]);
  const previous = new Map<number, number>();
  const open = [{ id: first, priority: distance(start, finish) }];
  const closed = new Set<number>();
  while (open.length) {
    // A binary heap keeps routing larger maps from scanning the whole frontier.
    const current = open[0];
    const tail = open.pop()!;
    if (open.length) {
      open[0] = tail;
      for (let at = 0; ;) {
        const left = at * 2 + 1;
        const right = left + 1;
        let child = at;
        if (left < open.length && open[left].priority < open[child].priority)
          child = left;
        if (right < open.length && open[right].priority < open[child].priority)
          child = right;
        if (child === at) break;
        [open[at], open[child]] = [open[child], open[at]];
        at = child;
      }
    }
    if (closed.has(current.id)) continue;
    if (current.id === last) {
      const path = [finish];
      for (let id = last; id !== first;) {
        id = previous.get(id)!;
        path.unshift(point(id));
      }
      const smooth = rounded([source, ...path, destination]);
      // Tight channels can make a rounded corner clip an obstacle. Keep a safe
      // right angle there rather than hiding any segment under a screen.
      return smooth
        .slice(1)
        .some((end, index) =>
          boxes.some((box) =>
            flowSegmentIntersectsBox(smooth[index], end, box),
          ),
        )
        ? [source, ...path, destination]
        : smooth;
    }
    closed.add(current.id);
    const x = current.id % xs.length;
    const y = Math.floor(current.id / xs.length);
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= xs.length || ny >= ys.length) continue;
      const next = key(nx, ny);
      const a = point(current.id);
      const b = point(next);
      if (closed.has(next) || blocked(a, b, obstacles)) continue;
      const cost = costs.get(current.id)! + distance(a, b);
      if (cost >= (costs.get(next) ?? Infinity)) continue;
      costs.set(next, cost);
      previous.set(next, current.id);
      open.push({ id: next, priority: cost + distance(b, finish) });
      for (let at = open.length - 1; at > 0;) {
        const parent = Math.floor((at - 1) / 2);
        if (open[parent].priority <= open[at].priority) break;
        [open[parent], open[at]] = [open[at], open[parent]];
        at = parent;
      }
    }
  }
  // Invalid overlapping external boxes cannot be routed safely. Do not draw a
  // misleading line through screen content.
  return [];
}
