/// <reference types="svelte" />

export interface ToolbarBatchActionsProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Override the total items selected text
   * @default (totalSelected) => `${totalSelected} item${totalSelected === 1 ? "" : "s"} selected`
   */
  formatTotalSelected?: (totalSelected: number) => string;
}

export default class ToolbarBatchActions {
  $$prop_def: ToolbarBatchActionsProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
