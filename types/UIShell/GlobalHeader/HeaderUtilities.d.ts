/// <reference types="svelte" />

export interface HeaderUtilitiesProps {}

export default class HeaderUtilities {
  $$prop_def: HeaderUtilitiesProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
