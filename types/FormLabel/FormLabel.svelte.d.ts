import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["label"];

export interface FormLabelProps extends RestProps {
  /**
   * Set an id to be used by the label element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  [key: `data-${string}`]: any;
}

export default class FormLabel extends SvelteComponentTyped<
  FormLabelProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
