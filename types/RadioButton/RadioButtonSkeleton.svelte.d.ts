import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type RadioButtonSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class RadioButtonSkeleton extends SvelteComponentTyped<
  RadioButtonSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
