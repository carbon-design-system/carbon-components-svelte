import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set to `true` to render a custom HTML element.
   * Props are destructured as `props` in the default slot.
   * @example
   * ```svelte
   * <Row let:props>
   *   <section {...props}>Content</section>
   * </Row>
   * ```
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

  [key: `data-${string}`]: any;
};

export type RowProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Row extends SvelteComponentTyped<
  RowProps,
  Record<string, any>,
  { default: { props: { class: string; [key: string]: any } } }
> {}
