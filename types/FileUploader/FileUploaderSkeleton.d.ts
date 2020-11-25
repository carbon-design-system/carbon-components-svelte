/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface FileUploaderSkeletonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class FileUploaderSkeleton extends SvelteComponent<
  FileUploaderSkeletonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
