import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type TabContentProps = Omit<$RestProps, keyof $Props> & $Props;

export default class TabContent extends SvelteComponentTyped<
  TabContentProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
