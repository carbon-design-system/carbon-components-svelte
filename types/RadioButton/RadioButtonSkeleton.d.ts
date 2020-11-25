/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface RadioButtonSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class RadioButtonSkeleton extends SvelteComponent<
  RadioButtonSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
