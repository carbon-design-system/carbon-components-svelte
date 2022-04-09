/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface RadioButtonGroupProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the selected radio button value
   * @default undefined
   */
  selected?: string;

  /**
   * Set to `true` to disable the radio buttons
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the legend text
   * @default ""
   */
  legendText?: string;

  /**
   * Set to `true` to visually hide the legend
   * @default false
   */
  hideLegend?: boolean;

  /**
   * Specify the label position
   * @default "right"
   */
  labelPosition?: "right" | "left";

  /**
   * Specify the orientation of the radio buttons
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Set an id for the container div element
   * @default undefined
   */
  id?: string;
}

export default class RadioButtonGroup extends SvelteComponentTyped<
  RadioButtonGroupProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    change: CustomEvent<any>;
  },
  { default: {}; legendText: {} }
> {}
