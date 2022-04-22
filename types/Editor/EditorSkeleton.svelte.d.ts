/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface EditorSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class EditorSkeleton extends SvelteComponentTyped<
  EditorSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
