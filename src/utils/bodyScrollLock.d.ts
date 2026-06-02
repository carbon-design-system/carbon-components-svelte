/**
 * Ref-counted body scroll lock: multiple holders can request
 * `bx--body--with-modal-open` without racing; the class is removed when the
 * last holder releases.
 */
export function acquireBodyScrollLock(): void;

export function releaseBodyScrollLock(): void;
