/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface AccordionItemProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
  /**
   * Specify the title of the accordion item heading
   * Alternatively, use the "title" slot (e.g., <div slot="title">...</div>)
   * @default "title"
   */
  title?: string;

  /**
   * Set to `true` to open the first accordion item
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to disable the accordion item
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the ARIA label for the accordion item chevron icon
   * @default "Expand/Collapse"
   */
  iconDescription?: string;
}

export default class AccordionItem extends SvelteComponentTyped<
  AccordionItemProps,
  {
    animationend: WindowEventMap["animationend"];
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: {}; title: {} }
> {}
