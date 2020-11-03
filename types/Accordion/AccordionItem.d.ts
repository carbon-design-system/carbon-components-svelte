/// <reference types="svelte" />

export default class AccordionItem {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> & {
    /**
     * Specify the title of the accordion item heading
     * Alternatively, use the named slot "title" (e.g. <div slot="title">...</div>)
     * @default "title"
     */
    title?: string;

    /**
     * Set to `true` to open the first accordion item
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to disable the accordion item
     * @default false
     */
    disabled?: boolean;

    /**
     * Specify the ARIA label for the accordion item chevron icon
     * @default "Expand/Collapse"
     */
    iconDescription?: string;
  };

  $$slot_def: {
    default: {};
    title: {};
  };

  $on(eventname: "animationend", cb: (event: WindowEventMap["animationend"]) => void): () => void;
  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
