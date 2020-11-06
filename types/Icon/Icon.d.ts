/// <reference types="svelte" />

export interface IconProps {
  /**
   * Specify the icon from `carbon-icons-svelte` to render
   * Icon size must be 16px (e.g. `Add16`, `Task16`)
   */
  render?: import("carbon-icons-svelte").CarbonIcon;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;
}

export default class Icon {
  $$prop_def: IconProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
