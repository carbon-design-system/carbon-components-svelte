/// <reference types="svelte" />
import { SvelteComponent } from "svelte";
import { IconSkeletonProps } from "./IconSkeleton";

export interface IconProps extends IconSkeletonProps, svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["svg"]> {
  /**
   * Specify the icon from `carbon-icons-svelte` to render
   */
  render?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;
}

export default class Icon extends SvelteComponent<
  IconProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
