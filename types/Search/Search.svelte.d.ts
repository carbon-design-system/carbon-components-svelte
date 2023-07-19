import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["input"];

export interface SearchProps extends RestProps {
  /**
   * Specify the value of the search input
   * @default ""
   */
  value?: any;

  /**
   * Specify the size of the search input
   * @default "xl"
   */
  size?: "sm" | "lg" | "xl";

  /**
   * Specify the class name passed to the outer div element
   * @default ""
   */
  searchClass?: string;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to disable the search input
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to enable the expandable variant
   * @default false
   */
  expandable?: boolean;

  /**
   * Set to `true to expand the search input
   * @default false
   */
  expanded?: boolean;

  /**
   * Specify the `placeholder` attribute of the search input
   * @default "Search..."
   */
  placeholder?: string;

  /**
   * Specify the `autocomplete` attribute
   * @default "off"
   */
  autocomplete?: "on" | "off";

  /**
   * Set to `true` to auto focus the search element
   * @default false
   */
  autofocus?: boolean;

  /**
   * Specify the close button label text
   * @default "Clear search input"
   */
  closeButtonLabelText?: string;

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Specify the icon to render.
   * Defaults to `<Search />`
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent<any>;

  /**
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  [key: `data-${string}`]: any;
}

export default class Search extends SvelteComponentTyped<
  SearchProps,
  {
    expand: CustomEvent<null>;
    collapse: CustomEvent<null>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    keydown: WindowEventMap["keydown"];
    keyup: WindowEventMap["keyup"];
    paste: DocumentAndElementEventHandlersEventMap["paste"];
    clear: CustomEvent<null>;
  },
  { labelText: {} }
> {}
