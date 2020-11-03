/// <reference types="svelte" />

export default class TooltipIcon {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> & {
    /**
     * Specify the tooltip text
     * @default ""
     */
    tooltipText?: string;

    /**
     * Set the alignment of the tooltip relative to the icon
     * @default "center"
     */
    align?: "start" | "center" | "end";

    /**
     * Set the direction of the tooltip relative to the icon
     * @default "bottom"
     */
    direction?: "top" | "right" | "bottom" | "left";

    /**
     * Set an id for the span element
     */
    id?: string;

    /**
     * Obtain a reference to the button HTML element
     * @default null
     */
    ref?: null | HTMLButtonElement;
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "focus", cb: (event: WindowEventMap["focus"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
