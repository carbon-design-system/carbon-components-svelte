/// <reference types="svelte" />

export default class TableBody {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["tbody"]> & {};

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
