/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface FormItemProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  [key: `data-${string}`]: any;
}

export default class FormItem extends SvelteComponentTyped<
  FormItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
