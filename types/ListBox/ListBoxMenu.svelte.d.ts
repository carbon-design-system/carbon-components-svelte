import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set an id for the top-level element
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type ListBoxMenuProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ListBoxMenu extends SvelteComponentTyped<
  ListBoxMenuProps,
  { scroll: WindowEventMap["scroll"] },
  { default: Record<string, never> }
> {}
