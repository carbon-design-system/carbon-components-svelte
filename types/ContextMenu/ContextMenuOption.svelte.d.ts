/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ContextMenuOptionProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
  /**
   * Specify the kind of option
   * @default "default"
   */
  kind?: "default" | "danger";

  /**
   * Set to `true` to enable the disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to indent the label
   * @default false
   */
  indented?: boolean;

  /**
   * Specify the icon to render
   * Icon is rendered to the left of the label text
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent;

  /**
   * Specify the label text
   * Alternatively, use the "labelText" slot (e.g., <span slot="labelText">...</span>)
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to use the selected variant
   * @default false
   */
  selected?: boolean;

  /**
   * Set to `true` to enable the selectable variant
   * Automatically set to `true` if `selected` is `true`
   * @default false
   */
  selectable?: boolean;

  /**
   * Specify the shortcut text
   * Alternatively, use the "shortcutText" slot (e.g., <span slot="shortcutText">...</span>)
   * @default ""
   */
  shortcutText?: string;

  /**
   * Specify the id
   * It's recommended to provide an id as a value to bind to within a selectable/radio menu group
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the list item HTML element
   * @default null
   */
  ref?: null | HTMLLIElement;
}

export default class ContextMenuOption extends SvelteComponentTyped<
  ContextMenuOptionProps,
  {
    keydown: WindowEventMap["keydown"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    click: CustomEvent<null>;
  },
  { default: {}; icon: {}; labelText: {}; shortcutText: {} }
> {}
