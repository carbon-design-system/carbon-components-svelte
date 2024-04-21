import type { SvelteComponentTyped } from "svelte";

export interface AccordionSkeletonProps {
  /**
   * Specify the number of accordion items.
   * @default 4
   */
  count?: number;

  /**
   * Specify the alignment of the accordion item chevron icon.
   * @default "end"
   */
  align?: "start" | "end";

  /**
   * Set to `true` to flush the accordion content text.
   *
   * **Note**: does not work with `align="start"`.
   * @default false
   */
  flush?: boolean;

  /**
   * Specify the size of the accordion.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Set to `true` to expand the first accordion item
   * @default false
   */
  open?: boolean;
}

export default class AccordionSkeleton extends SvelteComponentTyped<
  AccordionSkeletonProps,
  Record<string, any>,
  {}
> {}
