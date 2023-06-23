/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface FormProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["form"]> {
  /**
   * Obtain a reference to the form element
   * @default null
   */
  ref?: null | HTMLFormElement;
}

export default class Form extends SvelteComponent<
  FormProps,
  {
    click: WindowEventMap["click"];
    keydown: WindowEventMap["keydown"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    submit: WindowEventMap["submit"];
  },
  { default: {} }
> {}
