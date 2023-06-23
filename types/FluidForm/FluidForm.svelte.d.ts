/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface FluidFormProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["form"]> {}

export default class FluidForm extends SvelteComponent<
  FluidFormProps,
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
