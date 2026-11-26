// @ts-check
import { lazyComponent } from "../utils/lazy-component.js";

/**
 * The portaled tooltip and its positioning, shared by every component that
 * can show one. It renders only while open, so it loads in the background
 * once a component that may show one appears, usually well before the
 * tooltip's open delay ends.
 */
export const lazyPortalTooltip = lazyComponent(
  () => import("./PortalTooltip.svelte"),
);
