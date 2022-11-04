import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface TabsProps extends RestProps {
  /**
   * Specify the selected tab index
   * @default 0
   */
  selected?: number;

  /**
   * Set to `true` for tabs to be contained
   * @default false
   */
  contained?: boolean;

  /**
   * Set to `true` for tabs to have an auto-width
   * @default false
   */
  autoWidth?: boolean;

  [key: `data-${string}`]: any;
}

export default class Tabs extends SvelteComponentTyped<
  TabsProps,
  { change: CustomEvent<any> },
  { default: {}; content: {} }
> {}
