import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type SkeletonPlaceholderProps = Omit<$RestProps, keyof $Props> & $Props;

export default class SkeletonPlaceholder extends SvelteComponentTyped<
  SkeletonPlaceholderProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
