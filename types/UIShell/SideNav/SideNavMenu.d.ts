/// <reference types="svelte" />

export default class SideNavMenu {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> & {
    /**
     * Set to `true` to toggle the expanded state
     * @default false
     */
    expanded?: boolean;

    /**
     * Specify the text
     */
    text?: string;

    /**
     * Specify the icon props
     */
    icon?: { render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean };

    /**
     * Obtain a reference to the HTML button element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
