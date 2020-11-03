/// <reference types="svelte" />

export default class Tooltip {
  $$prop_def: svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> & {
    /**
     * Set the direction of the tooltip relative to the button
     * @default "bottom"
     */
    direction?: "top" | "right" | "bottom" | "left";

    /**
     * Set to `true` to open the tooltip
     * @default false
     */
    open?: boolean;

    /**
     * Set to `true` to hide the tooltip icon
     * @default false
     */
    hideIcon?: boolean;

    /**
     * Specify the icon from `carbon-icons-svelte` to render for the tooltip button
     * Icon size must be 16px (e.g. `Add16`, `Task16`)
     */
    icon?: typeof import("carbon-icons-svelte/lib/Add16").default;

    /**
     * Specify the ARIA label for the tooltip button
     * @default ""
     */
    iconDescription?: string;

    /**
     * Specify the icon name attribute
     * @default ""
     */
    iconName?: string;

    /**
     * Set the button tabindex
     * @default "0"
     */
    tabindex?: string;

    /**
     * Set an id for the tooltip
     */
    tooltipId?: string;

    /**
     * Set an id for the tooltip button
     */
    triggerId?: string;

    /**
     * Set the tooltip button text
     * @default ""
     */
    triggerText?: string;

    /**
     * Obtain a reference to the trigger text HTML element
     * @default null
     */
    ref?: null | HTMLElement;

    /**
     * Obtain a reference to the tooltip HTML element
     * @default null
     */
    refTooltip?: null | HTMLElement;

    /**
     * Obtain a reference to the icon HTML element
     * @default null
     */
    refIcon?: null | HTMLElement;
  };

  $$slot_def: {
    default: {};
    triggerText: {};
    icon: {};
  };

  $on(eventname: "undefined", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
