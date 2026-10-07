export type BlueprintTool = {
  id: string;
  title: string;
  kind: 'inspector';
  getSnapshot(): unknown;
  subscribe?: (listener: () => void) => () => void;
};

export type BlueprintToolContribution<
  TSnapshot = unknown,
  TUpdate = never,
> = Omit<BlueprintTool, 'getSnapshot'> & {
  getSnapshot(): TSnapshot;
  update?: (update: TUpdate) => void | Promise<void>;
};

export type BlueprintPlugin<
  TTool extends BlueprintTool = BlueprintTool,
> = {
  id: string;
  name: string;
  tools: readonly TTool[];
};
