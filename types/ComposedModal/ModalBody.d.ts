/// <reference types="svelte" />

export default class ModalBody {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Set to `true` if the modal contains form elements
     * @default false
     */
    hasForm?: boolean;

    /**
     * Set to `true` if the modal contains scrolling content
     * @default false
     */
    hasScrollingContent?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
