import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type TileGroupContext<T extends string = string> = {
  selectedValue: import("svelte/store").Writable<T | undefined>;
  groupName: import("svelte/store").Readable<string | undefined>;
  groupRequired: import("svelte/store").Readable<boolean | undefined>;
  add: (data: { checked: boolean; value: T }) => void;
  update: (value: T) => void;
};

type $RestProps = SvelteHTMLElements["fieldset"];

type $Props<T extends string = string> = {
  /**
   * Specify the selected tile value.
   * @default undefined
   */
  selected?: T | undefined;

  /**
   * Set to `true` to disable the tile group
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
   * <TileGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   * </TileGroup>
   * ```
   * @default ""
   */
  legendText?: string;

  legendChildren?: (this: void) => void;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type TileGroupProps<T extends string = string> = Omit<
  $RestProps,
  keyof $Props<T>
> &
  $Props<T>;

export default class TileGroup<
  T extends string = string,
> extends SvelteComponentTyped<
  TileGroupProps<T>,
  { select: CustomEvent<T> },
  { default: Record<string, never>; legendChildren: Record<string, never> }
> {}
