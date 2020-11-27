/// <reference types="svelte" />

export interface HeaderNavItemProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> {
  /**
   * Specify the `href` attribute
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
}

export default class HeaderNavItem {
  $$prop_def: HeaderNavItemProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "keyup", cb: (event: WindowEventMap["keyup"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: "focus", cb: (event: WindowEventMap["focus"]) => void): () => void;
  $on(eventname: "blur", cb: (event: WindowEventMap["blur"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
