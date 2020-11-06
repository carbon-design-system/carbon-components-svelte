/// <reference types="svelte" />

export interface ToolbarMenuProps {}

export default class ToolbarMenu {
  $$prop_def: ToolbarMenuProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
