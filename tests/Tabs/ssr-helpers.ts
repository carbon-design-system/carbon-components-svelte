/** Returns the tabs and tab panels in a server-rendered document. */
export function getParts(document: Document) {
  return {
    tabs: [...document.querySelectorAll("[role='tab']")],
    panels: [...document.querySelectorAll("[role='tabpanel']")],
  };
}

/** Asserts exactly `selectedIndex` of `count` tabs is selected, with its tab stop and visible panel. */
export function expectSelected(
  document: Document,
  selectedIndex: number,
  count = 3,
) {
  const { tabs, panels } = getParts(document);

  expect(tabs).toHaveLength(count);
  expect(panels).toHaveLength(count);

  tabs.forEach((tab, index) => {
    const selected = index === selectedIndex;
    expect(tab).toHaveAttribute("aria-selected", String(selected));
    expect(tab).toHaveAttribute("tabindex", selected ? "0" : "-1");
  });

  panels.forEach((panel, index) => {
    if (index === selectedIndex) {
      expect(panel).not.toHaveAttribute("hidden");
    } else {
      expect(panel).toHaveAttribute("hidden");
    }
  });
}
