/// <reference types="svelte" />

export default class ButtonSkeleton {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Set the `href` to use an anchor link
     */
    href?: string;

    /**
     * Specify the size of button skeleton
     * @default "default"
     */
    size?: "default" | "field" | "small";

    /**
     * Set to `true` to use the small variant
     * @default false
     */
    small?: boolean;
  };

  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
