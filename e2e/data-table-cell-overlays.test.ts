import { expect, type Locator, test } from "./helpers/host";

// A tooltip in place, or in a portal.
const TOOLTIP =
  ".bx--tooltip--visible .bx--assistive-text, .bx--tooltip--visible + .bx--assistive-text, .bx--tooltip-portal";

// Each component sits in a one-row DataTable. The table's scroll box ends
// under the cell, so an overlay that opens below it in place is cut off
// and stretches the box's scroll area.
const CASES = [
  ["Dropdown", ".bx--list-box__field", "click", ".bx--list-box__menu"],
  ["ComboBox", "input", "click", ".bx--list-box__menu"],
  ["MultiSelect", ".bx--list-box__field", "click", ".bx--list-box__menu"],
  ["OverflowMenu", ".bx--overflow-menu", "click", ".bx--overflow-menu-options"],
  ["MenuButton", "button", "click", ".bx--menu"],
  ["ComboButton", "button >> nth=1", "click", ".bx--menu"],
  ["Tooltip", ".bx--tooltip__trigger", "click", ".bx--tooltip--shown"],
  ["Toggletip", ".bx--toggletip-button", "click", ".bx--popover-contents"],
  ["OperationalTag", "button", "click", ".bx--popover-contents"],
  ["AILabel", "button", "click", ".bx--popover-contents"],
  ["DatePicker", "input", "click", ".bx--date-picker__calendar--open"],
  ["Button", ".bx--btn", "hover", TOOLTIP],
  ["TooltipIcon", ".bx--tooltip__trigger", "hover", TOOLTIP],
  ["TooltipDefinition", ".bx--tooltip__trigger", "hover", TOOLTIP],
  [
    "PasswordInput",
    ".bx--text-input--password__visibility__toggle",
    "hover",
    TOOLTIP,
  ],
  ["CopyInput", ".bx--copy-btn", "hover", TOOLTIP],
  ["CopyButton", ".bx--copy-btn", "hover", TOOLTIP],
] as const;

/** The corners of `overlay` that something else covers or cuts off. */
function hiddenCorners(overlay: Locator) {
  return overlay.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [
      [r.left + 2, r.top + 2],
      [r.right - 2, r.top + 2],
      [r.left + 2, r.bottom - 2],
      [r.right - 2, r.bottom - 2],
    ].filter(([x, y]) => !el.contains(document.elementFromPoint(x, y)));
  });
}

function scrollArea(box: Locator) {
  return box
    .locator(".bx--data-table-content")
    .evaluate((el) => el.scrollHeight - el.clientHeight);
}

// A hidden in-place tooltip and its caret are laid out against the window,
// so they don't stretch the table's scroll box before anything opens.
test("closed overlays add nothing to a cell's scroll area", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto("/data-table-cell-overlays.html");
  const overflow = await page.evaluate(
    (names) => {
      return names.map((name) => {
        const el = document.querySelector(
          `[data-testid="${name}"] .bx--data-table-content`,
        );
        return el
          ? [el.scrollWidth - el.clientWidth, el.scrollHeight - el.clientHeight]
          : null;
      });
    },
    CASES.map(([name]) => name),
  );
  CASES.forEach(([name], index) => {
    expect.soft(overflow[index], name).toEqual([0, 0]);
  });
});

for (const [name, trigger, how, overlay] of CASES)
  test(`${name} in a DataTable cell opens in full view`, async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/data-table-cell-overlays.html");
    const box = page.getByTestId(name);
    await box.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const rest = await scrollArea(box);

    const target = box.locator(trigger).first();
    await (how === "hover" ? target.hover() : target.click());
    const shown = page.locator(overlay).filter({ visible: true }).last();
    await expect(shown).toBeVisible();
    await expect.poll(() => hiddenCorners(shown)).toEqual([]);
    expect(await scrollArea(box)).toBeLessThanOrEqual(rest + 1);
  });

// The calendar moves to a portal once it shows, before focus goes in.
test("a DatePicker calendar keeps keyboard focus in the portal", async ({
  page,
}) => {
  await page.goto("/data-table-cell-overlays.html");
  const box = page.getByTestId("DatePicker");
  const input = box.getByRole("textbox", { name: "Due" });
  await input.click();
  const calendar = page.locator(".bx--date-picker__calendar--open");
  await expect(calendar).toBeVisible();
  await expect(box.locator(".bx--date-picker__calendar")).toHaveCount(0);

  await page.keyboard.press("ArrowDown");
  const focusedDay = () =>
    page.evaluate(() =>
      document.activeElement?.closest(".bx--date-picker__calendar--open")
        ? document.activeElement.getAttribute("aria-label")
        : null,
    );
  await expect.poll(focusedDay).toBeTruthy();
  const before = await focusedDay();
  await page.keyboard.press("ArrowRight");
  await expect.poll(focusedDay).not.toBe(before);

  await page.keyboard.press("Escape");
  await expect(calendar).toHaveCount(0);
  await expect(input).toBeFocused();
  // Back under the field, for the next open to measure.
  await expect(box.locator(".bx--date-picker__calendar")).toHaveCount(1);

  await input.click();
  await page.keyboard.press("ArrowDown");
  await expect.poll(focusedDay).toBeTruthy();
  await page.keyboard.press("Enter");
  await expect(input).not.toHaveValue("");
});

test("portalTooltip and portalMenu false keep the overlays in the table", async ({
  page,
}) => {
  await page.goto("/data-table-cell-overlays.html?portal=false");
  const button = page.getByTestId("Button");
  await button.locator(".bx--btn").hover();
  await expect(button.locator(".bx--tooltip--visible")).toHaveCount(1);
  await expect(page.locator(".bx--tooltip-portal")).toHaveCount(0);

  const picker = page.getByTestId("DatePicker");
  await picker.locator("input").click();
  await expect(
    picker.locator(".bx--date-picker__calendar--open"),
  ).toBeVisible();
});
