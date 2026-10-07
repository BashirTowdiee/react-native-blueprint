import type {
  BlueprintPlugin,
  BlueprintToolContribution,
} from '@react-native-blueprint/core';

export type BlueprintTokenPath = readonly string[];

export type BlueprintTokenUpdate = {
  path: BlueprintTokenPath;
  value: unknown;
};

export type BlueprintTokenSource<TTokens = unknown> = {
  getTokens(): TTokens;
  subscribe?: (listener: () => void) => () => void;
  updateToken?: (
    path: BlueprintTokenPath,
    value: unknown,
  ) => void | Promise<void>;
};

export type TokenInspectorOptions<TTokens> = {
  source: BlueprintTokenSource<TTokens>;
  id?: string;
  title?: string;
};

export function createTokenInspectorTool<TTokens>(
  options: TokenInspectorOptions<TTokens>,
): BlueprintToolContribution<TTokens, BlueprintTokenUpdate> {
  return {
    id: options.id ?? 'tokens',
    title: options.title ?? 'Design tokens',
    kind: 'inspector',
    getSnapshot: () => options.source.getTokens(),
    ...(options.source.subscribe
      ? {
          subscribe: (listener: () => void) =>
            options.source.subscribe!(listener),
        }
      : {}),
    ...(options.source.updateToken
      ? {
          update: ({ path, value }: BlueprintTokenUpdate) =>
            options.source.updateToken!(path, value),
        }
      : {}),
  };
}

export function createTokenInspectorPlugin<TTokens>(
  options: TokenInspectorOptions<TTokens>,
): BlueprintPlugin<
  BlueprintToolContribution<TTokens, BlueprintTokenUpdate>
> {
  return {
    id: 'tokens',
    name: 'Design tokens',
    tools: [createTokenInspectorTool(options)],
  };
}
