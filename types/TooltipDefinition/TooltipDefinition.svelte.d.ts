import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["span"];

type $Props = {
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

  [key: `data-${string}`]: any;
};

export type TooltipDefinitionProps = Omit<$RestProps, keyof $Props> & $Props;

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
  { default: Record<string, never>; tooltip: Record<string, never> }
> {}
