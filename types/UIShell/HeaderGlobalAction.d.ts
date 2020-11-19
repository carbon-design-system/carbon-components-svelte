/// <reference types="svelte" />

export interface HeaderGlobalActionProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to use the active variant
   * @default false
   */
  isActive?: boolean;

  /**
   * Specify the icon to render
   */
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Obtain a reference to the HTML button element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class HeaderGlobalAction {
  $$prop_def: HeaderGlobalActionProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
