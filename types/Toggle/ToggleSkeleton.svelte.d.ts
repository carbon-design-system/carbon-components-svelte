/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ToggleSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the toggle size
   * @default "default"
   */
  size?: "default" | "sm";

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class ToggleSkeleton extends SvelteComponentTyped<
  ToggleSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { labelText: {} }
> {}
