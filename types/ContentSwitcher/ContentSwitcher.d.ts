/// <reference types="svelte" />

export interface ContentSwitcherProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the selected index of the switch item
   * @default 0
   */
  selectedIndex?: number;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Specify the size of the content switcher
   */
  size?: "sm" | "xl";
}

export default class ContentSwitcher {
  $$prop_def: ContentSwitcherProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "change", cb: (event: CustomEvent<number>) => void): () => void;
  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
