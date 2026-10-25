export const COLOR_TOKENS: Record<string, Record<string, string>>;
export const SPLIT_TOKENS: Record<string, string[]>;
export const TYPE_STYLES: Record<string, string>;
export const LIGHT_COMPONENTS: Set<string>;
export const MODAL_COMPONENTS: Set<string>;
export const LAYER_03_PROPS: Record<string, string[]>;
export const FLATPICKR_RENAMES: Record<string, string>;
export function flatpickrAdvice(key: string): string;
export function propertyClass(
  property: string | undefined,
): "border" | "bg" | "color" | "icon" | "*" | undefined;
