/// <reference types="svelte" />

export interface FluidFormProps {}

export default class FluidForm {
  $$prop_def: FluidFormProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
