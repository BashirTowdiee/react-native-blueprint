import type { BlueprintRoute, BlueprintViewport } from './types';

export type BlueprintFlowRoute = BlueprintRoute & {
  id: string;
  name: string;
  viewport?: BlueprintViewport;
};
export type BlueprintFlowLink = { from: string; to: string };
export type BlueprintFlowMap = {
  nodes: readonly { route: BlueprintFlowRoute; parentId?: string }[];
  links?: readonly BlueprintFlowLink[];
};
export type BlueprintFlowNode = {
  route: BlueprintFlowRoute;
  parentId?: string;
  visited: boolean;
};
export type BlueprintFlowState = {
  nodes: readonly BlueprintFlowNode[];
  links: readonly BlueprintFlowLink[];
  /** Only this active navigation branch is mounted. Nodes survive a pop. */
  stack: readonly string[];
  transition?: BlueprintFlowLink & {
    sequence: number;
    kind: 'navigate' | 'back';
  };
};

function validateRoute(route: BlueprintFlowRoute) {
  if (!route.id.trim() || !route.name.trim()) {
    throw new Error('Flow routes require a non-empty id and name.');
  }
}

function uniqueLinks(links: readonly BlueprintFlowLink[]) {
  return links.filter(
    (link, index) =>
      link.from !== link.to &&
      links.findIndex(
        (other) => other.from === link.from && other.to === link.to,
      ) === index,
  );
}

export function createBlueprintFlowState(
  initialRoute: BlueprintFlowRoute,
  map?: BlueprintFlowMap,
): BlueprintFlowState {
  validateRoute(initialRoute);
  const ids = new Set<string>();
  const nodes: BlueprintFlowNode[] = (map?.nodes ?? []).map((node) => {
    validateRoute(node.route);
    if (ids.has(node.route.id))
      throw new Error(`Duplicate flow route: ${node.route.id}`);
    ids.add(node.route.id);
    return {
      ...node,
      route: node.route.id === initialRoute.id ? initialRoute : node.route,
      parentId: node.route.id === initialRoute.id ? undefined : node.parentId,
      visited: node.route.id === initialRoute.id,
    };
  });
  if (!ids.has(initialRoute.id)) {
    nodes.unshift({ route: initialRoute, visited: true });
    ids.add(initialRoute.id);
  }
  for (const node of nodes) {
    if (node.parentId && !ids.has(node.parentId))
      throw new Error(`Unknown flow parent: ${node.parentId}`);
    const ancestors = new Set([node.route.id]);
    let parent = node.parentId;
    while (parent) {
      if (ancestors.has(parent))
        throw new Error(`Cyclic flow hierarchy at ${parent}`);
      ancestors.add(parent);
      parent = nodes.find((other) => other.route.id === parent)?.parentId;
    }
  }
  const links = uniqueLinks([
    ...nodes.flatMap((node) =>
      node.parentId ? [{ from: node.parentId, to: node.route.id }] : [],
    ),
    ...(map?.links ?? []),
  ]);
  for (const link of links) {
    if (!ids.has(link.from) || !ids.has(link.to))
      throw new Error('Flow links must reference mapped routes.');
  }
  // Maps may supply links without parents. Infer a spanning tree, keeping
  // explicit parent relationships and tolerating cross-links/navigation cycles.
  const reached = new Set([initialRoute.id]);
  const queue = [initialRoute.id];
  for (let index = 0; index < queue.length; index++) {
    const from = queue[index];
    for (const link of links.filter((edge) => edge.from === from)) {
      if (reached.has(link.to)) continue;
      reached.add(link.to);
      queue.push(link.to);
      const node = nodes.find((other) => other.route.id === link.to)!;
      let ancestor: string | undefined = from;
      let cyclic = false;
      while (ancestor) {
        if (ancestor === node.route.id) {
          cyclic = true;
          break;
        }
        ancestor = nodes.find((other) => other.route.id === ancestor)?.parentId;
      }
      if (!node.parentId && !cyclic) node.parentId = from;
    }
  }
  return { nodes, links, stack: [initialRoute.id] };
}

export function navigateBlueprintFlow(
  state: BlueprintFlowState,
  from: string,
  destination: BlueprintFlowRoute,
): BlueprintFlowState {
  validateRoute(destination);
  const sourceIndex = state.stack.indexOf(from);
  // Ignore callbacks arriving after their screen was disposed.
  if (sourceIndex < 0) return state;
  const branch = state.stack.slice(0, sourceIndex + 1);
  const existingIndex = branch.indexOf(destination.id);
  const stack =
    existingIndex >= 0
      ? branch.slice(0, existingIndex + 1)
      : [...branch, destination.id];
  const exists = state.nodes.some((node) => node.route.id === destination.id);
  const nodes = exists
    ? state.nodes.map((node) =>
        node.route.id === destination.id
          ? {
              ...node,
              route: {
                ...destination,
                viewport: destination.viewport ?? node.route.viewport,
              },
              visited: true,
            }
          : node,
      )
    : [...state.nodes, { route: destination, parentId: from, visited: true }];
  const link = { from, to: destination.id };
  return {
    nodes,
    stack,
    links:
      existingIndex >= 0 ? state.links : uniqueLinks([...state.links, link]),
    transition:
      from === destination.id
        ? state.transition
        : {
            ...link,
            sequence: (state.transition?.sequence ?? 0) + 1,
            kind: existingIndex >= 0 ? 'back' : 'navigate',
          },
  };
}

export function backBlueprintFlow(
  state: BlueprintFlowState,
  from = state.stack[state.stack.length - 1],
): BlueprintFlowState {
  const index = state.stack.indexOf(from);
  if (index <= 0) return state;
  const stack = state.stack.slice(0, index);
  return {
    ...state,
    stack,
    transition: {
      from,
      to: stack[stack.length - 1],
      sequence: (state.transition?.sequence ?? 0) + 1,
      kind: 'back',
    },
  };
}
