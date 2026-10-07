import type {
  BlueprintPlugin,
  BlueprintToolContribution,
} from '@react-native-blueprint/core';

export type ReduxStoreLike<TState = unknown> = {
  getState(): TState;
  subscribe(listener: () => void): () => void;
};

export type ReduxInspectorOptions<TState, TSnapshot = TState> = {
  store: ReduxStoreLike<TState>;
  select?: (state: TState) => TSnapshot;
  id?: string;
  title?: string;
};

export function createReduxInspectorTool<TState, TSnapshot = TState>(
  options: ReduxInspectorOptions<TState, TSnapshot>,
): BlueprintToolContribution<TSnapshot> {
  const select =
    options.select ??
    ((state: TState) => state as unknown as TSnapshot);

  return {
    id: options.id ?? 'redux',
    title: options.title ?? 'Redux state',
    kind: 'inspector',
    getSnapshot: () => select(options.store.getState()),
    subscribe: (listener) => options.store.subscribe(listener),
  };
}

export function createReduxInspectorPlugin<TState, TSnapshot = TState>(
  options: ReduxInspectorOptions<TState, TSnapshot>,
): BlueprintPlugin<BlueprintToolContribution<TSnapshot>> {
  return {
    id: 'redux',
    name: 'Redux',
    tools: [createReduxInspectorTool(options)],
  };
}
