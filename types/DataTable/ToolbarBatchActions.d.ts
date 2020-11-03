/// <reference types="svelte" />

export default class ToolbarBatchActions {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Override the total items selected text
     * @default (totalSelected) => `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`
     */
    formatTotalSelected?: (totalSelected: number) => string;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
