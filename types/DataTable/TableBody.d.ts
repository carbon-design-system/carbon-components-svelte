/// <reference types="svelte" />

export interface TableBodyProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["tbody"]> {}

export default class TableBody {
  $$prop_def: TableBodyProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
