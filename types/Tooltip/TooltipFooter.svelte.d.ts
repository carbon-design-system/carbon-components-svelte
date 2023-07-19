import type { SvelteComponentTyped } from "svelte";

export interface TooltipFooterProps {
  /**
   * Specify a selector to be focused inside the footer when opening the tooltip
   * @default "a[href], button:not([disabled])"
   */
  selectorPrimaryFocus?: string;
}

export default class TooltipFooter extends SvelteComponentTyped<
  TooltipFooterProps,
  Record<string, any>,
  { default: {} }
> {}
