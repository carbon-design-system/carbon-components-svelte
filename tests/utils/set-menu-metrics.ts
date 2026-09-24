/** Stubs the scroll metrics jsdom leaves at zero, then scrolls the menu. */
export function setMenuMetrics(
  menu: HTMLElement,
  {
    scrollTop,
    scrollHeight,
    clientHeight,
  }: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
  Object.defineProperty(menu, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(menu, "clientHeight", {
    value: clientHeight,
    configurable: true,
  });
  menu.scrollTop = scrollTop;
}
