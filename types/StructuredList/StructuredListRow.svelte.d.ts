import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["label"];

export interface StructuredListRowProps extends RestProps {
  /**
   * Set to `true` to use as a header
   * @default false
   */
  head?: boolean;

  /**
   * Set to `true` to render a label slot
   * @default false
   */
  label?: boolean;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  [key: `data-${string}`]: any;
}

export default class StructuredListRow extends SvelteComponentTyped<
  StructuredListRowProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: {} }
> {}
