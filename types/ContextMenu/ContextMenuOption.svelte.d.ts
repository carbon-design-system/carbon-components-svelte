import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["li"];

type $Props = {
  /**
   * Specify the kind of option.
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
   * Specify the icon to render.
   * Icon is rendered to the left of the label text.
   * @default undefined
   */
  icon?: any;

  /**
   * Specify the label text.
   * Alternatively, use the "labelText" slot.
   * @example
   * ```svelte
   * <ContextMenuOption>
   *   <span slot="labelText">Custom Label</span>
   * </ContextMenuOption>
   * ```
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to use the selected variant
   * @default false
   */
  selected?: boolean;

  /**
   * Set to `true` to enable the selectable variant.
   * Automatically set to `true` if `selected` is `true`.
   * @default false
   */
  selectable?: boolean;

  /**
   * Specify the shortcut text.
   * Alternatively, use the "shortcutText" slot.
   * @example
   * ```svelte
   * <ContextMenuOption>
   *   <span slot="shortcutText">Ctrl+K</span>
   * </ContextMenuOption>
   * ```
   * @default ""
   */
  shortcutText?: string;

  /**
   * Specify the id.
   * It's recommended to provide an id as a value to bind to within a selectable/radio menu group.
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the list item HTML element
   * @default null
   */
  ref?: null | HTMLLIElement;

  [key: `data-${string}`]: any;
};

export type ContextMenuOptionProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ContextMenuOption extends SvelteComponentTyped<
  ContextMenuOptionProps,
  {
    keydown: WindowEventMap["keydown"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    click: CustomEvent<null>;
  },
  {
    icon: Record<string, never>;
    labelText: Record<string, never>;
    default: Record<string, never>;
    shortcutText: Record<string, never>;
  }
> {}
