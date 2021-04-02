/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface TableHeaderProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["th"]> {
  /**
   * Set to `true` to disable sorting on this specific cell
   * @default false
   */
  disableSorting?: boolean;

  /**
   * Specify the `scope` attribute
   * @default "col"
   */
  scope?: string;

  /**
   * Override the default id translations
   * @default () => ""
   */
  translateWithId?: () => string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class TableHeader extends SvelteComponentTyped<
  TableHeaderProps,
  {
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    click: WindowEventMap["click"];
  },
  { default: {} }
> {}
