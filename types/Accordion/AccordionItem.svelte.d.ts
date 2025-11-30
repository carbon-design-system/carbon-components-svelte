import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["li"];

type $Props = {
  /**
   * Specify the title of the accordion item heading.
   * Alternatively, use the "title" slot.
   * @example
   * ```svelte
   * <AccordionItem>
   *   <div slot="title">Custom Title</div>
   * </AccordionItem>
   * ```
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

  [key: `data-${string}`]: any;
};

export type AccordionItemProps = Omit<$RestProps, keyof $Props> & $Props;

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
  { title: Record<string, never>; default: Record<string, never> }
> {}
