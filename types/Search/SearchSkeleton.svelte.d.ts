import type { SvelteComponentTyped } from "svelte";

export interface SearchSkeletonProps {
  /**
   * Specify the size of the search input
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}

export default class SearchSkeleton extends SvelteComponentTyped<
  SearchSkeletonProps,
  Record<string, any>,
  {}
> {}
