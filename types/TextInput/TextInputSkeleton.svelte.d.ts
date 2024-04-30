import type { SvelteComponentTyped } from "svelte";

export interface TextInputSkeletonProps {
  /**
   * Set to `true` to hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class TextInputSkeleton extends SvelteComponentTyped<
  TextInputSkeletonProps,
  Record<string, any>,
  {}
> {}
