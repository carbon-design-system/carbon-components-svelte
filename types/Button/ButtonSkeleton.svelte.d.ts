import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["a"];

type $Props = {
  /**
   * Set the `href` to use an anchor link
   * @default undefined
   */
  href?: string;

  /**
   * Specify the size of button skeleton
   * @default "default"
   */
  size?: "default" | "field" | "small" | "lg" | "xl";

  [key: `data-${string}`]: any;
};

export type ButtonSkeletonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ButtonSkeleton extends SvelteComponentTyped<
  ButtonSkeletonProps,
  {
    click: WindowEventMap["click"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
