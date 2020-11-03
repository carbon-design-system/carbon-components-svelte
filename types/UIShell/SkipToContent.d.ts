/// <reference types="svelte" />

export default class SkipToContent {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> & {
    /**
     * Specify the `href` attribute
     * @default "#main-content"
     */
    href?: string;

    /**
     * Specify the tabindex
     * @default "0"
     */
    tabindex?: string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
