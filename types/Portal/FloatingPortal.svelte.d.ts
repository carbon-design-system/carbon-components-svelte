import { SvelteComponentTyped } from "svelte";

export type FloatingPortalProps = {
  /**
   * Reference element to position the portal relative to
   * @default null
   */
  reference?: HTMLElement | null;

  /**
   * Placement of the floating portal relative to the reference element
   * @default "bottom"
   */
  placement?:
    | "top"
    | "top-start"
    | "top-end"
    | "right"
    | "right-start"
    | "right-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end";

  /**
   * Offset in pixels from the reference element
   * @default 0
   */
  offset?: number;

  /**
   * Set to `true` to enable auto-update positioning on scroll/resize
   * @default true
   */
  autoUpdate?: boolean;
};

export default class FloatingPortal extends SvelteComponentTyped<
  FloatingPortalProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
