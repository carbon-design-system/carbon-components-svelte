import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["button"];

type $Props = {
  /**
   * Specify the switch text.
   * Alternatively, use the "text" slot
   * @example
   * ```svelte
   * <Switch>
   *   <span slot="text">Custom Text</span>
   * </Switch>
   * ```
   * @default "Provide text"
   */
  text?: string;

  /**
   * Set to `true` for the switch to be selected
   * @default false
   */
  selected?: boolean;

  /**
   * Set to `true` to disable the switch
   * @default false
   */
  disabled?: boolean;

  /**
   * Set an id for the button element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  [key: `data-${string}`]: any;
};

export type SwitchProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Switch extends SvelteComponentTyped<
  SwitchProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: Record<string, never> }
> {}
