/// <reference types="svelte" />

export default class HeaderPanelLink {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> & {
    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
