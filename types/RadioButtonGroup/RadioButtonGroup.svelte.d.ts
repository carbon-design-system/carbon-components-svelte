import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface RadioButtonGroupProps extends RestProps {
  /**
   * Set the selected radio button value
   * @default undefined
   */
  selected?: string | number;

  /**
   * Set to `true` to disable the radio buttons
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to require the selection of a radio button
   * @default undefined
   */
  required?: boolean;

  /**
   * Specify a name attribute for the radio button inputs
   * @default undefined
   */
  name?: string;

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

  [key: `data-${string}`]: any;
}

export default class RadioButtonGroup extends SvelteComponentTyped<
  RadioButtonGroupProps,
  {
    change: CustomEvent<string | number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {}; legendText: {} }
> {}
