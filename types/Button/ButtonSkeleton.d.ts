/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface ButtonSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set the `href` to use an anchor link
   */
  href?: string;

  /**
   * Specify the size of button skeleton
   * @default "default"
   */
  size?: "default" | "field" | "small";

  /**
   * Set to `true` to use the small variant
   * @default false
   */
  small?: boolean;
}

export default class ButtonSkeleton extends SvelteComponent<
  ButtonSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
