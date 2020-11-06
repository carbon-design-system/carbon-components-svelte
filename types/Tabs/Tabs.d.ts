/// <reference types="svelte" />

export interface TabsProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the selected tab index
   * @default 0
   */
  selected?: number;

  /**
   * Specify the type of tabs
   * @default "default"
   */
  type?: "default" | "container";

  /**
   * Specify the ARIA label for the chevron icon
   * @default "Show menu options"
   */
  iconDescription?: string;

  /**
   * Specify the tab trigger href attribute
   * @default "#"
   */
  triggerHref?: string;
}

export default class Tabs {
  $$prop_def: TabsProps;
  $$slot_def: {
    default: {};
    content: {};
  };

  $on(eventname: "keypress", cb: (event: WindowEventMap["keypress"]) => void): () => void;
  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "change", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
