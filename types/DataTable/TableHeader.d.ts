/// <reference types="svelte" />

export default class TableHeader {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["th"]> & {
    /**
     * Specify the `scope` attribute
     * @default "col"
     */
    scope?: string;

    /**
     * Override the default id translations
     * @default () => ""
     */
    translateWithId?: () => string;

    /**
     * Set an id for the top-level element
     */
    id?: string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
