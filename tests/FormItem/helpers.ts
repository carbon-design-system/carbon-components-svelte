/** Returns the rendered `.bx--form-item` root. */
export const getItem = () => {
  const item = document.querySelector<HTMLElement>(".bx--form-item");
  assert(item);
  return item;
};
