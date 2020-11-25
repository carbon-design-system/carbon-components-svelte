/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface FormItemProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {}

export default class FormItem extends SvelteComponent<
  FormItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
