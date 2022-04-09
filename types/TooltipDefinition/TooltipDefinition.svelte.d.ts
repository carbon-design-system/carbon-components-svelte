/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface TooltipDefinitionProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["span"]> {
  /**
   * Specify the tooltip text
   * @default ""
   */
  tooltipText?: string;

  /**
   * Set to `true` to open the tooltip
   * @default false
   */
  open?: boolean;

  /**
   * Set the alignment of the tooltip relative to the icon
   * @default "center"
   */
  align?: "start" | "center" | "end";

  /**
   * Set the direction of the tooltip relative to the icon
   * @default "bottom"
   */
  direction?: "top" | "bottom";

  /**
   * Set an id for the tooltip div element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class TooltipDefinition extends SvelteComponentTyped<
  TooltipDefinitionProps,
  {
    open: CustomEvent<null>;
    close: CustomEvent<null>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    focus: WindowEventMap["focus"];
  },
  { default: {}; tooltip: {} }
> {}
