import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["a"];

export interface ButtonSkeletonProps extends RestProps {
  /**
   * Set the `href` to use an anchor link
   * @default undefined
   */
  href?: string;

  /**
   * Specify the size of button skeleton
   * @default "lg"
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";

  [key: `data-${string}`]: any;
}

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
  {}
> {}
