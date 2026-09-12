declare module "flatpickr/dist/esm/plugins/rangePlugin" {
  interface RangePluginConfig {
    position?: string;
    input: HTMLInputElement;
  }

  const rangePlugin: new (config: RangePluginConfig) => unknown;
  export default rangePlugin;
}
