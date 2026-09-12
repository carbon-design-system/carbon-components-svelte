declare module "flatpickr/dist/esm/plugins/monthSelect" {
  interface MonthSelectPluginConfig {
    shorthand?: boolean;
    dateFormat?: string;
    altFormat?: string;
    theme?: string;
  }

  const monthSelectPlugin: (config?: MonthSelectPluginConfig) => unknown;
  export default monthSelectPlugin;
}
