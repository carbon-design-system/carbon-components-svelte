import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface FileUploaderSkeletonProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class FileUploaderSkeleton extends SvelteComponentTyped<
  FileUploaderSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
