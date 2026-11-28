interface ImportMeta {
  /**
   * Lazy imports of the files the patterns match, keyed by path relative
   * to the module; a pattern starting with `!` excludes. Expanded at build
   * time by `scripts/bun-plugins.ts`, so the patterns must be literals.
   */
  glob<T>(patterns: string[]): Record<string, () => Promise<T>>;
}

/** Bun bundles a stylesheet a module imports. */
declare module "*.css";

declare module "virtual:site" {
  /** The package's version. */
  export const VERSION: string;
  /** The package's GitHub URL. */
  export const REPO: string;
  /** Whether this is the dev server. */
  export const DEV: boolean;
}

declare module "virtual:component-api/file-paths" {
  const filePaths: Record<string, string>;
  export default filePaths;
}

declare module "virtual:component-api/*" {
  type ComponentApi =
    (typeof import("./COMPONENT_API.json"))["components"][number];
  const component: ComponentApi | null;
  export default component;
}

declare module "*/COMPONENT_MD_SIZES.json" {
  const sizes: Record<string, number>;
  export default sizes;
}
