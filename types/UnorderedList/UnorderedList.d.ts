/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface UnorderedListProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]> {
  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;
}

export default class UnorderedList extends SvelteComponent<
  UnorderedListProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
