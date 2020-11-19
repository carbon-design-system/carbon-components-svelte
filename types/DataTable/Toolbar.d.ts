/// <reference types="svelte" />

export interface ToolbarProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["section"]> {
  /**
   * Specify the toolbar size
   * @default "default"
   */
  size?: "sm" | "default";
}

export default class Toolbar {
  $$prop_def: ToolbarProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
