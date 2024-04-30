import type { SvelteComponentTyped } from "svelte";

export interface TextAreaSkeletonProps {
  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;
}

export default class TextAreaSkeleton extends SvelteComponentTyped<
  TextAreaSkeletonProps,
  Record<string, any>,
  {}
> {}
