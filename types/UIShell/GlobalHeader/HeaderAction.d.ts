/// <reference types="svelte" />

export interface HeaderActionSlideTransition {
  delay?: number;
  duration?: number;
  easing?: (t: number) => number;
}

export interface HeaderActionProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set to `true` to open the panel
   * @default false
   */
  isOpen?: boolean;

  /**
   * Specify the icon props
   */
  icon?: { render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean };

  /**
   * Specify the text
   * Alternatively, use the named slot "text" (e.g., <div slot="text">...</div>)
   */
  text?: string;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  /**
   * Customize the panel transition (i.e., `transition:slide`)
   * Set to `false` to disable the transition
   * @default { duration: 200 }
   */
  transition?: false | HeaderActionSlideTransition;
}

export default class HeaderAction {
  $$prop_def: HeaderActionProps;
  $$slot_def: {
    default: {};
    text: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "close", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
