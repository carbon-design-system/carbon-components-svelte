/// <reference types="svelte" />

export interface ContentProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["main"]> {
  /**
   * Specify the id for the main element
   * @default "main-content"
   */
  id?: string;
}

export default class Content {
  $$prop_def: ContentProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
