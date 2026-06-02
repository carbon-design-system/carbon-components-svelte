// @ts-check
let lockCount = 0;

export const acquireBodyScrollLock = () => {
  lockCount += 1;
  if (typeof document !== "undefined" && lockCount === 1) {
    document.body.classList.add("bx--body--with-modal-open");
  }
};

export const releaseBodyScrollLock = () => {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (typeof document !== "undefined" && lockCount === 0) {
    document.body.classList.remove("bx--body--with-modal-open");
  }
};
