import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["span"];

export interface PopoverContentProps extends RestProps {
  /**
   * @default null
   */
  className?: undefined;

  /**
   * @default {}
   */
  contentProps?: {};

  [key: `data-${string}`]: any;
}

export default class PopoverContent extends SvelteComponentTyped<
  PopoverContentProps,
  Record<string, any>,
  { default: {} }
> {}
