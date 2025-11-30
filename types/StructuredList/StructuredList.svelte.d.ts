import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type StructuredListWrapperContext = {
  selectedValue: import("svelte/store").Writable<string | undefined>;
  update: (value: string) => void;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the selected structured list row value.
   * @default undefined
   */
  selected?: string;

  /**
   * Set to `true` to use the condensed variant
   * @default false
   */
  condensed?: boolean;

  /**
   * Set to `true` to flush the list
   * @default false
   */
  flush?: boolean;

  /**
   * Set to `true` to use the selection variant
   * @default false
   */
  selection?: boolean;

  [key: `data-${string}`]: any;
};

export type StructuredListProps = Omit<$RestProps, keyof $Props> & $Props;

export default class StructuredList extends SvelteComponentTyped<
  StructuredListProps,
  {
    change: CustomEvent<string>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
