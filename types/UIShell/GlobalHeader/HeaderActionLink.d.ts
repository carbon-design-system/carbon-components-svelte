/// <reference types="svelte" />

export default class HeaderActionLink {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["a"]> & {
    /**
     * Set to `true` to use the active state
     * @default false
     */
    linkIsActive?: boolean;

    /**
     * Specify the `href` attribute
     */
    href?: string;

    /**
     * Specify the icon props
     */
    icon?: { render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean };

    /**
     * Obtain a reference to the HTML anchor element
     * @default null
     */
    ref?: null | HTMLAnchorElement;
  };

  $$slot_def: {};

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
