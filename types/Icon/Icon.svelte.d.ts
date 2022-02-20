/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";
import { IconSkeletonProps } from "./IconSkeleton.svelte";

export interface IconProps
  extends IconSkeletonProps,
    svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["svg"]> {
  /**
   * Specify the icon to render
   * @default undefined
   */
  render?: typeof import("svelte").SvelteComponent;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;
}

/**
 * @deprecated This component is deprecated.
 * Use icons from "carbon-icons-svelte" instead.
 */
export default class Icon extends SvelteComponentTyped<
  IconProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
