import type { ComponentType } from "svelte";

/**
 * A component that places a floating box (menu, tooltip, popover) in a
 * portal against an anchor element it binds itself. A render branch that
 * never binds that element leaves the box at the top left with no width,
 * as a filterable MultiSelect's menu did (#5676). Give each branch that
 * binds the anchor differently its own case.
 */
export type PortalCase = {
  /** Component name, as exported from the package. */
  name: string;
  /** The render branch this case takes. */
  variant: string;
  component: ComponentType;
  /** Props that force the portal on, and open it when there's an `open` prop. */
  props?: Record<string, unknown>;
  /** Opens the portal when props alone don't, like hovering an icon tooltip. */
  open?: () => Promise<void> | void;
  /** Portals open once `open` runs, when a nested one counts too. Defaults to 1. */
  portals?: number;
};

/** Components the contract skips, each with the reason. */
export type Exemptions = Record<string, string>;
