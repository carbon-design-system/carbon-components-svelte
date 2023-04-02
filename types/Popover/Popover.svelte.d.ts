import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["span"];

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
   * Set to `true` to render the tab tip variant
   * @default false
   */
  isTabTip?: boolean;

  /**
   * Set to `true` render a caret
   * @default undefined
   */
  caret?: boolean;

  /**
   * Specify the alignment of the caret
   * @default undefined
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
   * Set to `false` to omit the drop shadow
   * @default true
   */
  dropShadow?: boolean;

  /**
   * Set to `true` to enable the high contrast variant
   * @default false
   */
  highContrast?: boolean;

  [key: `data-${string}`]: any;
}

export default class Popover extends SvelteComponentTyped<
  PopoverProps,
  { ["click:outside"]: CustomEvent<{ target: HTMLElement }> },
  { default: {} }
> {}
