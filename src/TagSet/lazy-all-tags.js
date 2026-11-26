// @ts-check
import { lazyComponent } from "../utils/lazy-component.js";

/** The "View all" modal, with the Modal and Search it brings. */
export const lazyAllTags = lazyComponent(
  () => import("./TagSetAllTags.svelte"),
);
