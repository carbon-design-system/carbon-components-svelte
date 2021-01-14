/// <reference types="svelte" />

export interface HeadFiltersProps {}

export default class HeadFilters {
  $$prop_def: HeadFiltersProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
