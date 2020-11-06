/// <reference types="svelte" />

export interface SideNavProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["nav"]> {
  /**
   * Set to `true` to use the fixed variant
   * @default false
   */
  fixed?: boolean;

  /**
   * Specify the ARIA label for the nav
   */
  ariaLabel?: string;

  /**
   * Set to `true` to toggle the expanded state
   * @default false
   */
  isOpen?: boolean;
}

export default class SideNav {
  $$prop_def: SideNavProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
