/**
 * Ref-counted body scroll lock so multiple components (Modal, SideNav mobile
 * overlay, etc.) can independently request the `bx--body--with-modal-open`
 * class without racing. The class is added on the first acquire and removed
 * only when the last holder releases.
 */

/** Acquire the body scroll lock, adding the class on the first holder. */
export function acquireBodyScrollLock(): void;

/** Release the body scroll lock, removing the class when the last holder releases. */
export function releaseBodyScrollLock(): void;
