/// <reference types="svelte" />

export default class HeaderAction {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> & {
    /**
     * Set to `true` to open the panel
     * @default false
     */
    isOpen?: boolean;

    /**
     * Specify the icon props
     */
    icon?: { render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean };

    /**
     * Specify the text
     * Alternatively, use the named slot "text" (e.g. <div slot="text">...</div>)
     */
    text?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: {
    default: {};
    text: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "close", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "undefined", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
