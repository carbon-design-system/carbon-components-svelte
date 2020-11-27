/// <reference types="svelte" />

export interface HeaderNavMenuProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  expanded?: boolean;

  /**
   * Specify the `href` attribute
   * @default "/"
   */
  href?: string;

  /**
   * Specify the text
   */
  text?: string;

  /**
   * Obtain a reference to the HTML anchor element
   * @default null
   */
  ref?: null | HTMLAnchorElement;

  /**
   * Specify the ARIA label for the chevron icon
   * @default "Expand/Collapse"
   */
  iconDescription?: string;
}

export default class HeaderNavMenu {
  $$prop_def: HeaderNavMenuProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "keyup", cb: (event: WindowEventMap["keyup"]) => void): () => void;
  $on(eventname: "focus", cb: (event: WindowEventMap["focus"]) => void): () => void;
  $on(eventname: "blur", cb: (event: WindowEventMap["blur"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
