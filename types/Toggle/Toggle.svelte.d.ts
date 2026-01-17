import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the toggle size.
   * @default "default"
   */
  size?: "default" | "sm";

  /**
   * Set to `true` to toggle the checkbox input
   * @default false
   */
  toggled?: boolean;

  /**
   * Set to `true` to disable checkbox input
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the label for the untoggled state
   * @default "Off"
   */
  labelA?: string;

  /**
   * Specify the label for the toggled state
   * @default "On"
   */
  labelB?: string;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Set an id for the input element
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Specify a name attribute for the checkbox input.
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  labelChildren?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type ToggleProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Toggle extends SvelteComponentTyped<
  ToggleProps,
  {
    toggle: CustomEvent<{ toggled: boolean }>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    change: WindowEventMap["change"];
    keyup: WindowEventMap["keyup"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  {
    labelA: Record<string, never>;
    labelB: Record<string, never>;
    labelChildren: Record<string, never>;
  }
> {}
