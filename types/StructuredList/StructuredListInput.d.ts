/// <reference types="svelte" />

export default class StructuredListInput {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> & {
    /**
     * Set to `true` to check the input
     * @default false
     */
    checked?: boolean;

    /**
     * Specify the title of the input
     * @default "title"
     */
    title?: string;

    /**
     * Specify the value of the input
     * @default "value"
     */
    value?: string;

    /**
     * Set an id for the input element
     */
    id?: string;

    /**
     * Specify a name attribute for the input
     * @default ""
     */
    name?: string;

    /**
     * Obtain a reference to the input HTML element
     * @default null
     */
    ref?: null | HTMLInputElement;
  };

  $$slot_def: {};

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
