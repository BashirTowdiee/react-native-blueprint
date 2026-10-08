declare function blueprintSourcePlugin(api: { types: unknown }): unknown;
declare namespace blueprintSourcePlugin {
  interface Options {
    root?: string;
    include?: readonly string[];
    enabled?: boolean;
    componentUsages?: boolean;
    componentDirectories?: readonly string[];
  }
}
export = blueprintSourcePlugin;
