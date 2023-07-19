import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ListBoxMenuItemProps extends RestProps {
  /**
   * Set to `true` to enable the active state
   * @default false
   */
  active?: boolean;

  /**
   * Set to `true` to enable the highlighted state
   * @default false
   */
  highlighted?: boolean;

  /**
   * Set to `true` to disable the menu item
   * @default false
   */
  disabled?: boolean;

  [key: `data-${string}`]: any;
}

export default class ListBoxMenuItem extends SvelteComponentTyped<
  ListBoxMenuItemProps,
  {
    click: WindowEventMap["click"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
