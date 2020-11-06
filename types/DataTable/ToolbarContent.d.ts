/// <reference types="svelte" />

export interface ToolbarContentProps {}

export default class ToolbarContent {
  $$prop_def: ToolbarContentProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
