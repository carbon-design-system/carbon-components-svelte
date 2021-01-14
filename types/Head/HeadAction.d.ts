/// <reference types="svelte" />

export interface HeadActionProps {
  /**
   * Specify the href attribute
   */
  href?: string;

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   */
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Specify the description
   */
  description?: string;
}

export default class HeadAction {
  $$prop_def: HeadActionProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
