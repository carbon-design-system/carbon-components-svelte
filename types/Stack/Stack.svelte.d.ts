import type { SvelteComponentTyped } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type StackScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

type $RestProps = HTMLAttributes<HTMLElement>;

type $Props = {
  /**
   * Specify the gap between items in the stack.
   * The scale maps to Carbon layout values.
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
   * Specify the tag name.
   * @default "div"
   */
  tag?: keyof HTMLElementTagNameMap;

  [key: `data-${string}`]: any;
};

export type StackProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Stack extends SvelteComponentTyped<
  StackProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
