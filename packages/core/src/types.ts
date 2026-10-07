export type BlueprintMetadata = Readonly<Record<string, unknown>>;

export type BlueprintRoute = {
  pathname?: string;
  params?: Readonly<Record<string, unknown>>;
};

export type BlueprintViewport = {
  width: number;
  height: number;
  name?: string;
};

export type BlueprintVariant<TRender = unknown> = {
  id: string;
  name: string;
  render?: TRender;
  route?: BlueprintRoute;
  viewport?: BlueprintViewport;
  metadata?: BlueprintMetadata;
};

export type BlueprintScreen<TRender = unknown> = {
  id: string;
  name: string;
  render: TRender;
  route?: BlueprintRoute;
  variants?: readonly BlueprintVariant<TRender>[];
  viewport?: BlueprintViewport;
  metadata?: BlueprintMetadata;
};

export type BlueprintScreenManifest<TRender = unknown> =
  readonly BlueprintScreen<TRender>[];
