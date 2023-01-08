/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export type ColumnSize = boolean | number;

export interface ColumnSizeDescriptor {
  span?: ColumnSize;
  offset: number;
}

export type ColumnBreakpoint = ColumnSize | ColumnSizeDescriptor;

export interface ColumnProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the element tag
   * @default "div"
   */
  tag?: string;

  /**
   * Set to `true` to remove the gutter
   * @default false
   */
  noGutter?: boolean;

  /**
   * Set to `true` to remove the left gutter
   * @default false
   */
  noGutterLeft?: boolean;

  /**
   * Set to `true` to remove the right gutter
   * @default false
   */
  noGutterRight?: boolean;

  /**
   * Set to `true` to add top and bottom padding to the column
   * @default false
   */
  padding?: boolean;

  /**
   * Specify the aspect ratio of the column
   * @default undefined
   */
  aspectRatio?: "2x1" | "16x9" | "9x16" | "1x2" | "4x3" | "3x4" | "1x1";

  /**
   * Set the small breakpoint
   * @default undefined
   */
  sm?: ColumnBreakpoint;

  /**
   * Set the medium breakpoint
   * @default undefined
   */
  md?: ColumnBreakpoint;

  /**
   * Set the large breakpoint
   * @default undefined
   */
  lg?: ColumnBreakpoint;

  /**
   * Set the extra large breakpoint
   * @default undefined
   */
  xlg?: ColumnBreakpoint;

  /**
   * Set the maximum breakpoint
   * @default undefined
   */
  max?: ColumnBreakpoint;
}

export default class Column extends SvelteComponentTyped<
  ColumnProps,
  {},
  { default: {} }
> {}
