/// <reference types="svelte" />

export default class Content {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["main"]> & {
    /**
     * Specify the id for the main element
     * @default "main-content"
     */
    id?: string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
