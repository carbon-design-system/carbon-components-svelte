import type { SvelteComponentTyped } from "svelte";

export interface ButtonProps {
  /**
   * Specify the kind of button
   * @default "primary"
   */
  kind?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "ghost"
    | "danger"
    | "danger--tertiary"
    | "danger--ghost";

  /**
   * Specify the size of button
   * @default "lg"
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";

  /**
   * Set to `true` to use Carbon's expressive typesetting
   * @default false
   */
  expressive?: boolean;

  /**
   * Set to `true` to enable the selected state for an icon-only, ghost button
   * @default false
   */
  selected?: boolean;

  /**
   * Specify the icon to render
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent<any>;

  /**
   * Specify the ARIA label for the button icon
   * @default undefined
   */
  iconDescription?: string;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies to icon-only buttons
   * @default "center"
   */
  tooltipAlignment?: "start" | "center" | "end";

  /**
   * Set the position of the tooltip relative to the icon
   * @default "bottom"
   */
  tooltipPosition?: "top" | "right" | "bottom" | "left";

  /**
   * Specify an element name to render as the button.
   * Be sure to provide
   * @default undefined
   */
  as?: keyof import("svelte/elements").SvelteHTMLElements;

  /**
   * Set to `true` to disable the button
   * @default false
   */
  disabled?: boolean;

  /**
   * Set the `href` to use an anchor link
   * @default undefined
   */
  href?: string;

  /**
   * Specify the tabindex
   * @default "0"
   */
  tabindex?: string;

  /**
   * Specify the `type` attribute for the button element
   * @default "button"
   */
  type?: string;

  /**
   * Obtain a reference to the HTML element
   * @default null
   */
  ref?: null | HTMLElement;

  /**
   * Button, anchor, or div attributes
   * @default {}
   */
  buttonAttributes?:
    | import("svelte/elements").HTMLAnchorAttributes
    | import("svelte/elements").HTMLButtonAttributes
    | import("svelte/elements").HTMLAttributes;
}

export default class Button extends SvelteComponentTyped<
  ButtonProps,
  {
    click: WindowEventMap["click"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    pointerover: WindowEventMap["pointerover"];
    pointerenter: WindowEventMap["pointerenter"];
    pointerleave: WindowEventMap["pointerleave"];
  },
  { default: {} }
> {}
