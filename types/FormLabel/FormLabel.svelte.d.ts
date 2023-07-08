/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface FormLabelProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["label"]> {
  /**
   * Set an id to be used by the label element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class FormLabel extends SvelteComponent<
  FormLabelProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
