/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface CodeSnippetSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the type of code snippet
   * @default "single"
   */
  type?: "single" | "multi";
}

export default class CodeSnippetSkeleton extends SvelteComponentTyped<
  CodeSnippetSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
