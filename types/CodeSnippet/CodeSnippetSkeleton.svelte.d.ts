import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface CodeSnippetSkeletonProps extends RestProps {
  /**
   * Set the type of code snippet
   * @default "single"
   */
  type?: "single" | "multi";

  [key: `data-${string}`]: any;
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
