import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ListBoxMenuProps extends RestProps {
  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;

  [key: `data-${string}`]: any;
}

export default class ListBoxMenu extends SvelteComponentTyped<
  ListBoxMenuProps,
  { scroll: WindowEventMap["scroll"] },
  { default: {} }
> {}
