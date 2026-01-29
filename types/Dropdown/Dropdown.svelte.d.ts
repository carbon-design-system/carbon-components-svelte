import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type DropdownItem<Id = any> = {
  id: Id;
  text: string;
  /** Whether the item is disabled */
  disabled?: boolean;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props<Item extends DropdownItem<any> = DropdownItem<any>> = {
  /**
   * Set the dropdown items.
   * @default []
   */
  items?: ReadonlyArray<Item>;

  /**
   * Override the display of a dropdown item.
   */
  itemToString?: (item: Item) => string;

  /**
   * Specify the selected item id.
   * @default undefined
   */
  selectedId: Item["id"];

  /**
   * Specify the type of dropdown.
   * @default "default"
   */
  type?: "default" | "inline";

  /**
   * Specify the direction of the dropdown menu.
   * @default "bottom"
   */
  direction?: "bottom" | "top";

  /**
   * Specify the size of the dropdown field.
   * @default undefined
   */
  size?: "sm" | "lg" | "xl";

  /**
   * Set to `true` to open the dropdown
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to disable the dropdown
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the title text
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  /**
   * Specify the invalid state text
   * @default ""
   */
  invalidText?: string;

  /**
   * Set to `true` to indicate a warning state
   * @default false
   */
  warn?: boolean;

  /**
   * Specify the warning state text
   * @default ""
   */
  warnText?: string;

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Specify the list box label.
   * @default undefined
   */
  label?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @default undefined
   */
  translateWithId?: (
    id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId,
  ) => string;

  /**
   * Enable virtualization for large lists. Virtualization renders only the items currently visible in the viewport, improving performance for large lists.
   *
   * By default, virtualization is automatically enabled for lists with more than 100 items.
   *
   * Set `virtualize={false}` to explicitly disable virtualization, even for large lists.
   *
   * Set `virtualize={true}` to explicitly enable virtualization with default settings.
   *
   * Provide an object to customize virtualization behavior:
   * - `itemHeight` (default: 40): The height in pixels of each item. Specify a custom value when using custom slots with multi-line items or different heights.
   * - `containerHeight` (default: 300): The maximum height in pixels of the dropdown container.
   * - `overscan` (default: 3): The number of extra items to render above and below the viewport for smoother scrolling. Higher values may cause more flickering during very fast scrolling.
   * - `threshold` (default: 100): The minimum number of items required before virtualization activates. Lists with fewer items will render all items normally without virtualization.
   * - `maxItems` (default: undefined): The maximum number of items to render. When undefined, all visible items are rendered.
   * @default undefined
   */
  virtualize?:
    | undefined
    | boolean
    | {
        itemHeight?: number;
        containerHeight?: number;
        overscan?: number;
        threshold?: number;
        maxItems?: number;
      };

  /**
   * Set an id for the list box component
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Specify a name attribute for the list box.
   * @default undefined
   */
  name?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  /**
   * Obtain a reference to the list HTML element.
   * @default null
   */
  listRef?: null | HTMLDivElement;

  children?: (this: void, ...args: [{ item: Item; index: number }]) => void;

  [key: `data-${string}`]: any;
};

export type DropdownProps<Item extends DropdownItem<any> = DropdownItem<any>> =
  Omit<$RestProps, keyof $Props<Item>> & $Props<Item>;

export default class Dropdown<
  Item extends DropdownItem<any> = DropdownItem<any>,
> extends SvelteComponentTyped<
  DropdownProps<Item>,
  {
    select: CustomEvent<{
      selectedId: Item["id"];
      selectedItem: Item;
    }>;
    scroll: WindowEventMap["scroll"];
  },
  { default: { item: Item; index: number } }
> {}
