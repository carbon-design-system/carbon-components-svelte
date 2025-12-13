import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type SelectableTileGroupContext = {
  selectedValues: import("svelte/store").Writable<T[]>;
  groupName: import("svelte/store").Readable<string | undefined>;
  add: (data: { selected: boolean; value: T }) => void;
  update: (data: { value: T; selected: boolean }) => void;
};

type $RestProps = SvelteHTMLElements["fieldset"];

type $Props<T> = {
  /**
   * Specify the selected tile values.
   * @default []
   */
  selected?: T[];

  /**
   * Set to `true` to disable the tile group
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify a name attribute for the checkbox inputs.
   * @default undefined
   */
  name?: string | undefined;

  /**
   * Specify the legend text
   * @default ""
   */
  legendText?: string;

  [key: `data-${string}`]: any;
};

export type SelectableTileGroupProps<T> = Omit<$RestProps, keyof $Props<T>> &
  $Props<T>;

export default class SelectableTileGroup<
  T extends string = string,
> extends SvelteComponentTyped<
  SelectableTileGroupProps<T>,
  { select: CustomEvent<T>; deselect: CustomEvent<T> },
  { default: Record<string, never> }
> {}
