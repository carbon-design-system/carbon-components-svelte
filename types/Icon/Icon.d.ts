/// <reference types="svelte" />
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

export default class Icon {
  $$prop_def: IconProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
