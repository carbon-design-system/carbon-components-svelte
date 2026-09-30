import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/**
 * Pass/fail definition of "easy to override": a consumer rule made of one
 * custom class (plus a state or one child element) must beat the library's
 * rule for the same property. Fixture: e2e/fixtures/consumer-override.css.
 *
 * Each fixture loads once and every case reads from it. Cases with a `gap`
 * are library selectors that still out-weigh a single-class consumer rule;
 * they assert the override still loses, so they fail once the selector is
 * flattened. Move the case out of the gap list then.
 */

const RED = "rgb(200, 0, 0)";
const RED_HOVER = "rgb(150, 0, 0)";
const GRAY = "rgb(100, 100, 100)";
const PINK = "rgb(255, 230, 230)";
const PINK_HOVER = "rgb(255, 200, 200)";

type Case = {
  name: string;
  target: (page: Page) => Locator;
  state?: "hover" | "focus";
  property: string;
  value: string;
  /** The library selector that still wins. */
  gap?: string;
};

const id = (testId: string, child?: string) => (page: Page) =>
  child
    ? page.getByTestId(testId).locator(child).first()
    : page.getByTestId(testId);

const cell = (testId: string, row: number) => (page: Page) =>
  page.getByTestId(testId).locator("tbody tr").nth(row).locator("td").last();

async function check(page: Page, cases: Case[]) {
  for (const { name, target, state, property, value, gap } of cases) {
    const el = target(page);
    // biome-ignore lint/performance/noAwaitInLoops: one pointer, one focus
    if (state === "hover") await el.hover();
    if (state === "focus") await el.focus();
    if (!gap) {
      await expect.soft(el, name).toHaveCSS(property, value);
      continue;
    }
    // A losing override never matches, so `toHaveCSS` would retry until it
    // times out. Let transitions settle and read the value once instead.
    const actual = await el.evaluate(async (node, property) => {
      await Promise.all(node.getAnimations().map((a) => a.finished));
      return getComputedStyle(node).getPropertyValue(property);
    }, property);
    expect
      .soft(actual, `${name} now wins over ${gap}; drop its gap`)
      .not.toBe(value);
  }
}

// Static cases first: a hover or focus case leaves its state behind.
const cases: Case[] = [
  {
    name: "button background",
    target: id("btn"),
    property: "background-color",
    value: RED,
  },
  {
    name: "button disabled background",
    target: id("btn-disabled"),
    property: "background-color",
    value: GRAY,
  },
  {
    name: "button icon-only icon fill",
    target: id("icon-btn", "svg"),
    property: "fill",
    value: RED,
  },
  {
    name: "button icon-only icon path fill",
    target: id("icon-btn", "svg path"),
    property: "fill",
    value: RED,
  },
  {
    name: "button text icon color",
    target: id("text-icon-btn"),
    property: "color",
    value: RED,
  },
  {
    name: "button text icon fill",
    target: id("text-icon-btn", "svg"),
    property: "fill",
    value: RED,
  },
  {
    name: "button text icon path fill",
    target: id("text-icon-btn", "svg path"),
    property: "fill",
    value: RED,
  },
  { name: "link color", target: id("link"), property: "color", value: RED },
  {
    name: "inline link text-decoration",
    target: id("link-inline"),
    property: "text-decoration-line",
    value: "none",
  },
  {
    name: "tag border",
    target: id("tag"),
    property: "border-top-color",
    value: RED,
  },
  {
    name: "tag background",
    target: id("tag"),
    property: "background-color",
    value: PINK,
  },
  {
    name: "data table row background",
    target: cell("table", 0),
    property: "background-color",
    value: PINK,
  },
  {
    name: "data table cellClass color",
    target: cell("table", 0),
    property: "color",
    value: RED,
  },
  {
    name: "data table selected row background",
    target: cell("table", 1),
    property: "background-color",
    value: PINK,
  },
  {
    name: "data table zebra rowClass background",
    target: cell("table-zebra", 1),
    property: "background-color",
    value: PINK,
    gap: ".bx--data-table--zebra>tbody>tr:not(.bx--parent-row):nth-child(even)>td (0,3,3)",
  },
  {
    name: "unselected tab underline",
    target: (page) => page.getByTestId("tabs").locator(".my-tab a").nth(1),
    property: "border-bottom-color",
    value: RED,
  },
  {
    name: "selected tab underline",
    target: (page) => page.getByTestId("tabs").locator(".my-tab a").nth(0),
    property: "border-bottom-color",
    value: RED,
  },
  {
    name: "container tab background",
    target: (page) =>
      page.getByTestId("tabs-container").locator(".my-container-tab").nth(1),
    property: "background-color",
    value: PINK,
  },
  {
    name: "selected container tab background",
    target: (page) =>
      page.getByTestId("tabs-container").locator(".my-container-tab").nth(0),
    property: "background-color",
    value: PINK,
  },
  {
    name: "toast icon fill",
    target: id("toast", "svg"),
    property: "fill",
    value: RED,
  },
  {
    name: "toast link color",
    target: id("toast-link"),
    property: "color",
    value: RED,
  },
  {
    name: "low-contrast toast background",
    target: id("toast-low"),
    property: "background-color",
    value: PINK,
  },
  {
    name: "inline notification icon fill",
    target: id("inline", "svg"),
    property: "fill",
    value: RED,
  },
  {
    name: "button hover background",
    target: id("btn"),
    state: "hover",
    property: "background-color",
    value: RED_HOVER,
  },
  {
    name: "link hover color",
    target: id("link"),
    state: "hover",
    property: "color",
    value: RED_HOVER,
  },
  {
    name: "data table hover row background",
    target: cell("table", 2),
    state: "hover",
    property: "background-color",
    value: PINK_HOVER,
    gap: ".bx--data-table tbody tr:hover td (0,2,3)",
  },
  {
    name: "button icon-only focus border",
    target: id("icon-btn"),
    state: "focus",
    property: "border-top-color",
    value: RED,
  },
];

const contextCases: Case[] = [
  {
    name: "side nav link text color",
    target: id("side-link", "span"),
    property: "color",
    value: RED,
  },
  {
    // Needs `@layer` or a token-based layer context, not a flatten, so it
    // stays a documented gap.
    name: "text input background inside a modal",
    target: id("modal-input"),
    property: "background-color",
    value: PINK,
    gap: ".bx--modal .bx--text-input (0,2,0)",
  },
];

test("consumer overrides win over library rules", async ({ page }) => {
  await page.goto("/consumer-override.html");
  // The pointer starts at (0,0), on top of the first button, so its hover
  // rule would win the static assertions. Park it in empty space.
  const size = page.viewportSize() ?? { width: 1280, height: 720 };
  await page.mouse.move(size.width - 1, size.height - 1);
  await check(page, cases);
});

test("consumer overrides win inside other components", async ({ page }) => {
  await page.goto("/consumer-override-contexts.html");
  await check(page, contextCases);
});
