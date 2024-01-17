import type { SvelteComponentTyped } from "svelte";

export interface TextInputSkeletonProps {
  /**
   * Set to `true` to hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Specify the div HTML attributes for the skeleton container
   * @default {}
   */
  divAttributes?: import("svelte/elements").HTMLDivAttributes;
}

export default class TextInputSkeleton extends SvelteComponentTyped<
  TextInputSkeletonProps,
  {
    click: WindowEventMap["click"];
    pointerup: WindowEventMap["pointerup"];
    pointerover: WindowEventMap["pointerover"];
    pointerenter: WindowEventMap["pointerenter"];
    pointerleave: WindowEventMap["pointerleave"];
  },
  {}
> {}
