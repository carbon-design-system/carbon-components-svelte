/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface FileUploaderSkeletonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

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
