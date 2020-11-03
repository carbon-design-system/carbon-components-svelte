/// <reference types="svelte" />

export default class Breadcrumb {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> & {
    /**
     * Set to `true` to hide the breadcrumb trailing slash
     * @default false
     */
    noTrailingSlash?: boolean;

    /**
     * Set to `true` to display skeleton state
     * @default false
     */
    skeleton?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
