import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type FormContext = {
  formContext: { isFluid: boolean };
};

type $RestProps = SvelteHTMLElements["form"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type FluidFormProps = Omit<$RestProps, keyof $Props> & $Props;

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
  { default: Record<string, never> }
> {}
