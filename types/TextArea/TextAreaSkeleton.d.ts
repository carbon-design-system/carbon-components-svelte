/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface TextAreaSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class TextAreaSkeleton extends SvelteComponent<
  TextAreaSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
