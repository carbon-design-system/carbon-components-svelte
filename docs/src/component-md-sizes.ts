import COMPONENT_MD_SIZES_JSON from "./COMPONENT_MD_SIZES.json";

export const COMPONENT_MD_SIZES: Record<string, number> =
  COMPONENT_MD_SIZES_JSON;

export function markdownBytesFor(name: string): number {
  return COMPONENT_MD_SIZES[name] ?? 0;
}
