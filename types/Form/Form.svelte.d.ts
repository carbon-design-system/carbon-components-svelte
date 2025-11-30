import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["form"];

type $Props = {
  /**
   * Obtain a reference to the form element
   * @default null
   */
  ref?: null | HTMLFormElement;

  [key: `data-${string}`]: any;
};

export type FormProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Form extends SvelteComponentTyped<
  FormProps,
  {
    click: WindowEventMap["click"];
    keydown: WindowEventMap["keydown"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    submit: WindowEventMap["submit"];
  },
  { default: Record<string, never> }
> {}
