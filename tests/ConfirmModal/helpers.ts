/** Whether the `.bx--modal` overlay is currently visible. */
export function isOpen() {
  const modal = document.querySelector(".bx--modal");
  assert(modal);
  return modal.classList.contains("is-visible");
}
