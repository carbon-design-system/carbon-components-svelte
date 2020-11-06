/// <reference types="svelte" />

export interface SideNavMenuProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
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
  icon?: { render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean };

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class SideNavMenu {
  $$prop_def: SideNavMenuProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
