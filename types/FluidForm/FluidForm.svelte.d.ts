/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface FluidFormProps {}

export default class FluidForm extends SvelteComponentTyped<
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
