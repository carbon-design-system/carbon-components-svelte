/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface RowProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g., <Row let:props><section {...props}>...</section></Row>)
   * @default false
   */
  as?: boolean;

  /**
   * Set to `true` to use the condensed variant
   * @default false
   */
  condensed?: boolean;

  /**
   * Set to `true` to use the narrow variant
   * @default false
   */
  narrow?: boolean;

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
   * Set to `true` to add top and bottom padding to all columns
   * @default false
   */
  padding?: boolean;
}

export default class Row extends SvelteComponentTyped<
  RowProps,
  {},
  { default: { props: { class: string; [key: string]: any } } }
> {}
