import type { SvelteComponentTyped } from "svelte";

export interface StructuredListSkeletonProps {
  /**
   * Specify the number of rows
   * @default 5
   */
  count?: number;
}

export default class StructuredListSkeleton extends SvelteComponentTyped<
  StructuredListSkeletonProps,
  Record<string, any>,
  {}
> {}
