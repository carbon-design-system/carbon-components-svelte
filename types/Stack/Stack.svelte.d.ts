import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type StackScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

type RestProps = SvelteHTMLElements["svelte:element"];

export interface StackProps extends RestProps {
  /**
   * Specify the gap between items in the stack.
   * The scale maps to Carbon layout values.
   * Alternatively, specify a custom value (e.g., "200px").
   * @default 1
   */
  gap?: StackScale | string;

  /**
   * Specify the orientation of the stack.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";

  /**
   * Specify the tag name
   * @default "div"
   */
  tag?: keyof HTMLElementTagNameMap;

  [key: `data-${string}`]: any;
}

export default class Stack extends SvelteComponentTyped<
  StackProps,
  Record<string, any>,
  { default: {} }
> {}
