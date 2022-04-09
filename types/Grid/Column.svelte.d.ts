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
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g., <Column let:props><article {...props}>...</article></Column>)
   * @default false
   */
  as?: boolean;

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
  { default: { props: { class: string; [key: string]: any } } }
> {}
