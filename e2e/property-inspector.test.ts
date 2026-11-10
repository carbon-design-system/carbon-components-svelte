import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

type Shape = Record<string, unknown> & { id: string };
type LogEntry = {
  source: string;
  transaction: number;
  property: string;
  changes: Array<{
    targetId: string;
    property: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
};

async function shapes(page: Page) {
  const text = await page.getByTestId("shapes").textContent();
  return JSON.parse(text ?? "[]") as Shape[];
}

async function shape(page: Page, id: string) {
  const found = (await shapes(page)).find((item) => item.id === id);
  if (!found) throw new Error(`no shape ${id}`);
  return found;
}

async function log(page: Page) {
  const text = await page.getByTestId("log").textContent();
  return JSON.parse(text ?? "[]") as LogEntry[];
}

const field = (page: Page, name: string) =>
  page.getByRole("spinbutton", { name, exact: true });

test.describe("PropertyInspector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/property-inspector.html");
  });

  test("shows the value of one object and Mixed for several", async ({
    page,
  }) => {
    await expect(field(page, "Rotation")).toHaveValue("0");
    await expect(field(page, "Rotation")).toHaveAttribute(
      "aria-valuetext",
      "0 degrees",
    );

    await page.getByTestId("select-abc").click();
    await expect(field(page, "Rotation")).toHaveValue("");
    await expect(field(page, "Rotation")).toHaveAttribute(
      "placeholder",
      "Mixed",
    );
    await expect(field(page, "Rotation")).toHaveAttribute(
      "aria-valuetext",
      "Mixed",
    );
    // Agreeing values stay: all three shapes have y = 20.
    await expect(field(page, "Position Y")).toHaveValue("20");
    await expect(
      page.getByRole("checkbox", { name: "Visible" }),
    ).toHaveJSProperty("indeterminate", true);
    await expect(page.getByRole("combobox", { name: "Blend" })).toHaveValue(
      "__mixed__",
    );
    await expect(
      page.getByRole("switch", { name: "Clip content" }),
    ).toHaveAccessibleDescription("Mixed");
    await expect(
      page.getByRole("textbox", { name: "Fill", exact: true }),
    ).toHaveAttribute("placeholder", "Mixed");
  });

  test("leaves out a property the selection does not all have", async ({
    page,
  }) => {
    await expect(field(page, "Corner radius")).toBeVisible();
    await page.getByTestId("select-abc").click();
    await expect(field(page, "Corner radius")).toHaveCount(0);
  });

  test("writes one typed value to every object, as one change", async ({
    page,
  }) => {
    await page.getByTestId("select-abc").click();
    const opacity = field(page, "Opacity");
    await opacity.fill("50");
    await opacity.press("Enter");

    expect((await shapes(page)).map((item) => item.opacity)).toEqual([
      50, 50, 50,
    ]);
    const entries = await log(page);
    expect(entries).toHaveLength(1);
    expect(entries[0].changes.map((change) => change.oldValue)).toEqual([
      100, 80, 100,
    ]);
    // The field now has the one value, and the row is marked modified.
    await expect(opacity).toHaveValue("50");
  });

  test("adds a typed +10 to each object's own value", async ({ page }) => {
    await page.getByTestId("select-abc").click();
    const x = field(page, "Position X");
    await x.fill("+10");
    await x.press("Enter");

    expect((await shapes(page)).map((item) => item.x)).toEqual([20, 50, 80]);
    await expect(x).toHaveValue("");
    await expect(x).toHaveAttribute("placeholder", "Mixed");
    expect(await log(page)).toHaveLength(1);
  });

  test("clamps each object to the limits", async ({ page }) => {
    await page.getByTestId("select-abc").click();
    const opacity = field(page, "Opacity");
    await opacity.fill("+50");
    await opacity.press("Enter");
    expect((await shapes(page)).map((item) => item.opacity)).toEqual([
      100, 100, 100,
    ]);
  });

  test("scrubs the label, relative to each value, in one undo step", async ({
    page,
  }) => {
    await page.getByTestId("select-abc").click();
    const label = page.getByText("Rotation", { exact: true }).first();
    const box = await label.boundingBox();
    if (!box) throw new Error("no label");
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 4, y);
    await page.mouse.down();
    // 40px at 4px per step: +10.
    await page.mouse.move(box.x + 44, y, { steps: 10 });
    // Mid-drag the objects follow.
    await expect.poll(async () => (await shape(page, "a")).rotation).toBe(10);
    expect(await log(page)).toHaveLength(0);
    await page.mouse.up();

    expect((await shapes(page)).map((item) => item.rotation)).toEqual([
      10, 10, 25,
    ]);
    const entries = await log(page);
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("scrub");
    expect(entries[0].changes.map((change) => change.oldValue)).toEqual([
      0, 0, 15,
    ]);

    await page.getByTestId("undo").click();
    expect((await shapes(page)).map((item) => item.rotation)).toEqual([
      0, 0, 15,
    ]);
  });

  test("scrubs the other way in right-to-left", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const label = page.getByText("Rotation", { exact: true }).first();
    const box = await label.boundingBox();
    if (!box) throw new Error("no label");
    const y = box.y + box.height / 2;
    const x = box.x + box.width - 4;
    await page.mouse.move(x, y);
    await page.mouse.down();
    // Toward the inline end is left.
    await page.mouse.move(x - 40, y, { steps: 10 });
    await page.mouse.up();
    expect((await shape(page, "a")).rotation).toBe(10);
  });

  test("steps with the arrow keys, ten with Shift, from the keyboard alone", async ({
    page,
  }) => {
    const rotation = field(page, "Rotation");
    await rotation.focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Shift+ArrowUp");
    await expect(rotation).toHaveValue("12");
    await page.keyboard.press("ArrowDown");
    await expect(rotation).toHaveValue("11");
    expect((await shape(page, "a")).rotation).toBe(11);
    // Every press is its own undo step.
    expect(await log(page)).toHaveLength(4);
    await expect(rotation).toHaveAttribute("aria-valuetext", "11 degrees");
  });

  test("reaches every control with Tab, one stop per field, in reading order", async ({
    page,
  }) => {
    await page.getByTestId("select-abc").click();
    await page.getByRole("searchbox", { name: "Search properties" }).focus();
    const stops: string[] = [];
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press("Tab");
      stops.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          return (
            el?.getAttribute("aria-label") ||
            (el as HTMLInputElement | null)?.labels?.[0]?.textContent?.trim() ||
            el?.textContent?.trim() ||
            el?.id ||
            ""
          );
        }),
      );
    }
    // The search clear button is hidden while the field is empty. A modified
    // row's reset button follows its label, before the field.
    expect(stops.slice(0, 7)).toEqual([
      "Layout",
      "Name",
      "Reset Position",
      "Position X",
      "Position Y",
      "Reset Size",
      "Size W",
    ]);
  });

  test("steps each object from its own value when mixed", async ({ page }) => {
    await page.getByTestId("select-abc").click();
    const rotation = field(page, "Rotation");
    await rotation.focus();
    await page.keyboard.press("Shift+ArrowUp");
    expect((await shapes(page)).map((item) => item.rotation)).toEqual([
      10, 10, 25,
    ]);
    await expect(rotation).toHaveAttribute("aria-valuetext", "Mixed");
  });

  test("keeps focus on the field when the selection changes", async ({
    page,
  }) => {
    const x = field(page, "Position X");
    await x.focus();
    await page.evaluate(() =>
      (window as unknown as { __select(ids: string[]): void }).__select([
        "a",
        "b",
      ]),
    );
    await expect(x).toBeFocused();
    await expect(x).toHaveValue("");
    await page.evaluate(() =>
      (window as unknown as { __select(ids: string[]): void }).__select(["b"]),
    );
    await expect(x).toBeFocused();
    await expect(x).toHaveValue("40");
  });

  test("resets a modified property, and returns focus to the row", async ({
    page,
  }) => {
    const rotation = field(page, "Rotation");
    await rotation.focus();
    await page.keyboard.press("ArrowUp");
    const reset = page.getByRole("button", { name: "Reset Rotation" });
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(rotation).toHaveValue("0");
    await expect(reset).toHaveCount(0);
    await expect(rotation).toBeFocused();
    const entries = await log(page);
    expect(entries[entries.length - 1].source).toBe("reset");
  });

  test("keeps the aspect ratio while the lock is on", async ({ page }) => {
    await page.getByRole("button", { name: "Lock aspect ratio" }).click();
    const width = field(page, "Size W");
    await width.fill("200");
    await width.press("Enter");
    const card = await shape(page, "a");
    expect([card.width, card.height]).toEqual([200, 120]);
    const entries = await log(page);
    expect(entries[0].changes.map((change) => change.property).sort()).toEqual([
      "height",
      "width",
    ]);
  });

  test("filters the properties and announces the count", async ({ page }) => {
    await page
      .getByRole("searchbox", { name: "Search properties" })
      .fill("str");
    await expect(
      page.getByRole("textbox", { name: "Stroke", exact: true }),
    ).toBeVisible();
    await expect(field(page, "Rotation")).toHaveCount(0);
    await expect(page.getByRole("status").last()).toHaveText(/\d+ propert/);
    await page
      .getByRole("searchbox", { name: "Search properties" })
      .fill("zzz");
    await expect(page.getByText("No properties match.")).toBeVisible();
  });

  test("shows a read-only property that cannot be edited", async ({ page }) => {
    await expect(
      page.getByRole("textbox", { name: "Identifier" }),
    ).toHaveAttribute("readonly", "");
  });

  test("names the groups with headings and collapses them", async ({
    page,
  }) => {
    const layout = page.getByRole("heading", { name: "Layout" });
    await expect(layout).toBeVisible();
    const toggle = layout.getByRole("button");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(field(page, "Rotation")).toBeHidden();
    await toggle.click();
    await expect(field(page, "Rotation")).toBeVisible();
  });

  test("has no accessibility violations, one object or several", async ({
    page,
  }) => {
    const one = await new AxeBuilder({ page }).include("#app").analyze();
    expect(one.violations).toEqual([]);
    await page.getByTestId("select-abc").click();
    const many = await new AxeBuilder({ page }).include("#app").analyze();
    expect(many.violations).toEqual([]);
  });

  test("has no accessibility violations in Gray 100 and right-to-left", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.documentElement.dir = "rtl";
    });
    await page.getByTestId("select-abc").click();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
