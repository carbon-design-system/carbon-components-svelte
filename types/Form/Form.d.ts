/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface FormProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["form"]> {}

export default class Form extends SvelteComponent<
  FormProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    submit: WindowEventMap["submit"];
  },
  { default: {} }
> {}
