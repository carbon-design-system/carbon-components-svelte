/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface CodeSnippetSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the type of code snippet
   * @default "single"
   */
  type?: "single" | "inline" | "multi";
}

export default class CodeSnippetSkeleton extends SvelteComponent<
  CodeSnippetSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
