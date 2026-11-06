/// <reference types="vite/client" />

declare const __PKG_VERSION: string;
declare const __PKG_REPO: string;

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
