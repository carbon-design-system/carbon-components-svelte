/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface ToolbarSearchProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Specify the value of the search input
   * @default ""
   */
  value?: number | string;

  /**
   * Set to `true` to expand the search bar
   * @default false
   */
  expanded?: boolean;

  /**
   * Set to `true` to keep the search bar expanded
   * @default false
   */
  persistent?: boolean;

  /**
   * Set to `true` to disable the search bar
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;
}

export default class ToolbarSearch extends SvelteComponentTyped<
  ToolbarSearchProps,
  {
    clear: WindowEventMap["clear"];
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
  },
  {}
> {}
