import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface PopoverProps extends RestProps {
  /**
   * Set to `true` to display the popover
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to close the popover on an outside click
   * @default false
   */
  closeOnOutsideClick?: boolean;

  /**
   * Set to `true` render a caret
   * @default false
   */
  caret?: boolean;

  /**
   * Specify the alignment of the caret
   * @default "top"
   */
  align?:
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "left-bottom"
    | "left-top"
    | "right"
    | "right-bottom"
    | "right-top";

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to enable the high contrast variant
   * @default false
   */
  highContrast?: boolean;

  /**
   * Set to `true` to use a relative position
   * @default false
   */
  relative?: boolean;

  [key: `data-${string}`]: any;
}

export default class Popover extends SvelteComponentTyped<
  PopoverProps,
  { ["click:outside"]: CustomEvent<{ target: HTMLElement }> },
  { default: {} }
> {}
