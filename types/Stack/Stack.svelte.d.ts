import { SvelteComponentTyped } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * The stack scale maps to the following `@carbon/layout` values:
 * - 0  --> 0 (no gap)
 * - 1  --> 0.125rem
 * - 2  --> 0.25rem
 * - 3  --> 0.5rem
 * - 4  --> 0.75rem
 * - 5  --> 1rem
 * - 6  --> 1.5rem
 * - 7  --> 2rem
 * - 8  --> 2.5rem
 * - 9  --> 3rem
 * - 10 --> 4rem
 * - 11 --> 5rem
 * - 12 --> 6rem
 * - 13 --> 10rem
 */
export type StackScale =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

type $RestProps = HTMLAttributes<HTMLElement>;

type $Props = {
  /**
   * Specify the gap between items in the stack.
   * The scale maps to Carbon layout values.
   * Use 0 to omit any gap class.
   * Alternatively, specify a custom value (e.g., "200px" or "1.5rem").
   * Custom values *must* be a string.
   * @default 1
   */
  gap?: StackScale | string;

  /**
   * Specify the orientation of the stack.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";

  /**
   * Specify the cross-axis alignment of items in the stack.
   * @default "stretch"
   */
  align?: "start" | "center" | "end" | "stretch" | "baseline";

  /**
   * Specify the main-axis alignment of items in the stack.
   * @default "start"
   */
  justify?:
    | "start"
    | "center"
    | "end"
    | "space-between"
    | "space-around"
    | "space-evenly";

  /**
   * Specify the tag name.
   * @default "div"
   */
  tag?: keyof HTMLElementTagNameMap;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type StackProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Stack extends SvelteComponentTyped<
  StackProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
