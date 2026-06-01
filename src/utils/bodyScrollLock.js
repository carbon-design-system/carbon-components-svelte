// @ts-check
// Ref-counted body scroll lock so multiple components (Modal, SideNav mobile
// overlay, etc.) can independently request the `bx--body--with-modal-open`
// class without racing. The class is added on the first acquire and removed
// only when the last holder releases.
let lockCount = 0;

/** Acquire the body scroll lock, adding the class on the first holder. */
export const acquireBodyScrollLock = () => {
  lockCount += 1;
  if (typeof document !== "undefined" && lockCount === 1) {
    document.body.classList.add("bx--body--with-modal-open");
  }
};

/** Release the body scroll lock, removing the class when the last holder releases. */
export const releaseBodyScrollLock = () => {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (typeof document !== "undefined" && lockCount === 0) {
    document.body.classList.remove("bx--body--with-modal-open");
  }
};
