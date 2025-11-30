import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ProgressIndicatorContext = {
  steps: import("svelte/store").Writable<
    ReadonlyArray<{
      id: string;
      complete: boolean;
      disabled: boolean;
      index: number;
      current: boolean;
    }>
  >;
  stepsById: import("svelte/store").Readable<
    Record<
      string,
      {
        id: string;
        complete: boolean;
        disabled: boolean;
        index: number;
        current: boolean;
      }
    >
  >;
  preventChangeOnClick: import("svelte/store").Readable<boolean>;
  add: (step: { id: string; complete: boolean; disabled: boolean }) => void;
  change: (index: number) => void;
};

type $RestProps = SvelteHTMLElements["ul"];

type $Props = {
  /**
   * Specify the current step index
   * @default 0
   */
  currentIndex?: number;

  /**
   * Set to `true` to use the vertical variant
   * @default false
   */
  vertical?: boolean;

  /**
   * Set to `true` to specify whether the progress steps should be split equally in size in the div
   * @default false
   */
  spaceEqually?: boolean;

  /**
   * Set to `true` to prevent `currentIndex` from updating
   * @default false
   */
  preventChangeOnClick?: boolean;

  [key: `data-${string}`]: any;
};

export type ProgressIndicatorProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ProgressIndicator extends SvelteComponentTyped<
  ProgressIndicatorProps,
  {
    change: CustomEvent<number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
