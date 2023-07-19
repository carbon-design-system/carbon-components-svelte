import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface GridProps extends RestProps {
  /**
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g., <Grid let:props><header {...props}>...</header></Grid>)
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
   * Set to `true` to use the fullWidth variant
   * @default false
   */
  fullWidth?: boolean;

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

  [key: `data-${string}`]: any;
}

export default class Grid extends SvelteComponentTyped<
  GridProps,
  Record<string, any>,
  { default: { props: { class: string; [key: string]: any } } }
> {}
