import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectSingleRing } from "./helpers/layout";

const NOW = "2026-11-06T17:30:00Z";

const trigger = (page: Page) =>
  page.getByRole("button", { name: /^Time range/ });
const quick = (page: Page, name: string) =>
  page.getByRole("dialog").getByRole("button", { name, exact: true });
const text = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el) => el.textContent);

async function open(page: Page, query = `now=${NOW}&tz=America/New_York`) {
  await page.goto(`/time-range-picker.html?${query}`);
  await expect(trigger(page)).toBeVisible();
}

test.describe("TimeRangePicker", () => {
  // The page is shared by the tests of a worker.
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.removeAttribute("dir");
    });
  });

  test("applies a quick range and keeps the value relative", async ({
    page,
  }) => {
    await open(page);
    await expect(trigger(page)).toContainText("Last 15 minutes");
    await trigger(page).click();
    await quick(page, "Last 7 days").click();
    expect(await text(page, "value")).toBe("now-7d..now");
    await expect(trigger(page)).toContainText("Last 7 days");
    await expect(trigger(page)).toBeFocused();
    expect(await text(page, "last")).toBe(
      "preset 2026-10-30T16:30:00.000Z 2026-11-06T17:30:00.000Z",
    );
  });

  test("works from the keyboard alone", async ({ page }) => {
    await open(page);
    // Tab: back, trigger. ArrowDown opens and lands on the current range.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(trigger(page)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(quick(page, "Last 15 minutes")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    expect(await text(page, "value")).toBe("now-24h..now");
    await expect(trigger(page)).toBeFocused();

    // Escape closes and returns to the trigger.
    await page.keyboard.press("Enter");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
  });

  test("tabs through the panel in reading order and applies with Enter", async ({
    page,
  }) => {
    await open(page);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    // Quick ranges are one stop. Then the mode switch, From, To, zone,
    // refresh, Apply.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tab", { name: "Relative" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("From")).toBeFocused();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("last 2 hours");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("From")).toHaveValue("now-2h");
    await expect(page.getByLabel("To")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Time zone")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Refresh every")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Apply" })).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await text(page, "value")).toBe("now-2h..now");
  });

  test("an absolute range reads the time of day across the spring-forward gap", async ({
    page,
  }) => {
    // Sunday March 8, 2026: clocks in New York skip 02:00 to 03:00.
    await open(page, "now=2026-03-08T15:00:00Z&tz=America/New_York");
    await trigger(page).click();
    await page.getByRole("tab", { name: "Absolute" }).click();
    await page.getByLabel("Start time").fill("01:30");
    await page.getByLabel("End time").fill("03:30");
    await page.getByRole("button", { name: "Apply" }).click();
    // 01:30 EST to 03:30 EDT is one hour.
    expect(await text(page, "value")).toBe(
      "2026-03-08T06:30:00.000Z..2026-03-08T07:30:00.000Z",
    );
    await expect(trigger(page)).toContainText(
      "Mar 8, 01:30 – 03:30 (UTC−5/UTC−4)",
    );
  });

  test("Today is a 23 hour day when clocks go forward, in two zones", async ({
    page,
  }) => {
    await open(page, "now=2026-03-08T15:00:00Z&tz=America/New_York");
    await trigger(page).click();
    await quick(page, "Today").click();
    expect(await text(page, "last")).toBe(
      "preset 2026-03-08T05:00:00.000Z 2026-03-09T03:59:59.999Z",
    );
    await open(page, "now=2026-10-25T12:00:00Z&tz=Europe/Berlin");
    await trigger(page).click();
    await quick(page, "Today").click();
    // Clocks go back: 25 hours.
    expect(await text(page, "last")).toBe(
      "preset 2026-10-24T22:00:00.000Z 2026-10-25T22:59:59.999Z",
    );
  });

  test("changing the zone keeps the instants", async ({ page }) => {
    await open(
      page,
      `now=${NOW}&tz=America/New_York&from=2026-11-06T14:00:00.000Z&to=2026-11-06T17:30:00.000Z`,
    );
    await trigger(page).click();
    await page.getByLabel("Time zone").selectOption("Europe/Berlin");
    await expect(page.getByLabel("Start time")).toHaveValue("15:00");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(trigger(page)).toContainText("Nov 6, 15:00 – 18:30 (UTC+1)");
    expect(await text(page, "zone")).toBe("Europe/Berlin");
  });

  test("steps back, forward and zooms out", async ({ page }) => {
    await open(page);
    await expect(
      page.getByRole("button", { name: "Next time range" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Previous time range" }).click();
    expect(await text(page, "value")).toBe(
      "2026-11-06T17:00:00.000Z..2026-11-06T17:15:00.000Z",
    );
    await page.getByRole("button", { name: "Zoom out" }).click();
    expect(await text(page, "value")).toBe(
      "2026-11-06T16:52:30.000Z..2026-11-06T17:22:30.000Z",
    );
    await page.getByRole("button", { name: "Next time range" }).click();
    // The step would end after now, so it moves back to end at now.
    expect(await text(page, "value")).toBe(
      "2026-11-06T17:00:00.000Z..2026-11-06T17:30:00.000Z",
    );
  });

  test("refreshes on the interval", async ({ page }) => {
    await open(page, `now=${NOW}&tz=UTC&intervals=1`);
    await trigger(page).click();
    await page.getByLabel("Refresh every").selectOption("1");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect.poll(() => text(page, "refreshes")).toBe("2");
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect.poll(() => text(page, "refreshes")).toMatch(/^[3-9]$/);
  });

  test("an invalid range stays open and says why", async ({ page }) => {
    await open(page);
    await trigger(page).click();
    await page.getByRole("tab", { name: "Relative" }).click();
    await page.getByLabel("To").fill("now-1h");
    await expect(
      page.getByText("The end must be after the start."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByLabel("To")).toBeFocused();
    expect(await text(page, "value")).toBe("now-15m..now");
  });

  test("RTL mirrors the controls and opens from the inline start", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const back = await page
      .getByRole("button", { name: "Previous time range" })
      .boundingBox();
    const next = await page
      .getByRole("button", { name: "Next time range" })
      .boundingBox();
    const field = await trigger(page).boundingBox();
    const group = await page.getByRole("group").boundingBox();
    // Back sits at the inline start, which is the right in RTL.
    expect(back!.x).toBeGreaterThan(field!.x);
    expect(next!.x).toBeLessThan(field!.x);
    await trigger(page).click();
    const panel = await page.getByRole("dialog").boundingBox();
    // Aligned to the right edge of the group, its inline start.
    expect(
      Math.abs(panel!.x + panel!.width - (group!.x + group!.width)),
    ).toBeLessThan(2);
    // The back chevron points toward the inline start.
    const transform = await page
      .getByRole("button", { name: "Previous time range" })
      .locator("svg")
      .evaluate((svg) => getComputedStyle(svg).transform);
    expect(transform).not.toBe("none");
  });

  test("forced colors mark the current quick range and keep one ring", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await trigger(page).click();
    const current = quick(page, "Last 15 minutes");
    await expect(current).toHaveAttribute("aria-current", "true");
    const colors = await current.evaluate((el) => {
      const probe = document.createElement("div");
      document.body.append(probe);
      probe.style.backgroundColor = "Highlight";
      const highlight = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return { highlight, background: getComputedStyle(el).backgroundColor };
    });
    expect(colors.background).toBe(colors.highlight);
    await expectSingleRing(page.getByRole("dialog"));
  });

  test("Gray 100 paints the panel on the dark layer", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await trigger(page).click();
    const layer = await page.getByRole("dialog").evaluate((el) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--cds-layer)";
      el.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    // Gray 100 layer-01 is #262626.
    expect(layer).toBe("rgb(38, 38, 38)");
  });
});
