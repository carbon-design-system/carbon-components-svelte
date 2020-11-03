/// <reference types="svelte" />

export default class ModalFooter {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Specify the primary button text
     * @default ""
     */
    primaryButtonText?: string;

    /**
     * Set to `true` to disable the primary button
     * @default false
     */
    primaryButtonDisabled?: boolean;

    /**
     * Specify a class for the primary button
     */
    primaryClass?: string;

    /**
     * Specify the secondary button text
     * @default ""
     */
    secondaryButtonText?: string;

    /**
     * Specify a class for the secondary button
     */
    secondaryClass?: string;

    /**
     * Set to `true` to use the danger variant
     * @default false
     */
    danger?: boolean;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
