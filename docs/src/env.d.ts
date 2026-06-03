/// <reference types="vite/client" />

declare const __PKG_VERSION: string;
declare const __PKG_REPO: string;

declare module "*/COMPONENT_MD_SIZES.json" {
  const sizes: Record<string, number>;
  export default sizes;
}
