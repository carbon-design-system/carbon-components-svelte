import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type RadioButtonGroupContext = {
  selectedValue: import("svelte/store").Writable<string | number | undefined>;
  groupName: any;
  groupRequired: any;
  add: (data: { checked: boolean; value: string | number }) => void;
  update: (value: string | number) => void;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set the selected radio button value.
   * @default undefined
   */
  selected?: string | number;

  /**
   * Set to `true` to disable the radio buttons
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to require the selection of a radio button.
   * @default undefined
   */
  required?: boolean;

  /**
   * Specify a name attribute for the radio button inputs.
   * @default undefined
   */
  name?: string;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <RadioButtonGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   *   <RadioButton labelText="Option 1" value="1" />
   *   <RadioButton labelText="Option 2" value="2" />
   *   <RadioButton labelText="Option 3" value="3" />
   * </RadioButtonGroup>
   * ```
   * @default ""
   */
  legendText?: string;

  /**
   * Set to `true` to visually hide the legend
   * @default false
   */
  hideLegend?: boolean;

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Specify the label position.
   * @default "right"
   */
  labelPosition?: "right" | "left";

  /**
   * Specify the orientation of the radio buttons.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Set an id for the container div element.
   * @default undefined
   */
  id?: string;

  [key: `data-${string}`]: any;
};

export type RadioButtonGroupProps = Omit<$RestProps, keyof $Props> & $Props;

export default class RadioButtonGroup extends SvelteComponentTyped<
  RadioButtonGroupProps,
  {
    change: CustomEvent<string | number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { legendChildren: Record<string, never>; default: Record<string, never> }
> {}
