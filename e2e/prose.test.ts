import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";

const style = (locator: Locator, property: string) =>
  locator.evaluate(
    (el, prop) => getComputedStyle(el).getPropertyValue(prop),
    property,
  );

test.describe("Prose", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prose.html");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("sets plain markup in the variant's type scale", async ({ page }) => {
    expect(await style(page.getByTestId("raw-p"), "font-size")).toBe("16px");
    expect(
      await style(page.getByRole("heading", { level: 1 }), "font-size"),
    ).toBe("32px");
    expect(await style(page.getByTestId("raw-ul"), "list-style-type")).toBe(
      "disc",
    );
    expect(await style(page.getByTestId("raw-pre"), "overflow-x")).toBe("auto");
    expect(
      await style(page.getByTestId("raw-code"), "background-color"),
    ).not.toBe("rgba(0, 0, 0, 0)");
    expect(
      await style(page.getByTestId("raw-link"), "text-decoration-line"),
    ).toBe("underline");
  });

  test("spaces copy inside a section wrapper", async ({ page }) => {
    const paragraph = page.getByTestId("section-p");
    expect(await style(paragraph, "margin-top")).toBe("12px");
    expect(await style(paragraph.locator(".."), "margin-top")).toBe("32px");
  });

  test("leaves Carbon components inside with their own styles", async ({
    page,
  }) => {
    const prose = page.getByTestId("prose");
    const outside = page.getByTestId("outside");
    const cases: [string, string[]][] = [
      [".bx--type-body-long-01", ["font-size", "line-height"]],
      [".bx--link", ["color", "text-decoration-line", "font-size"]],
      [".bx--list--unordered", ["padding-inline-start", "list-style-type"]],
      [".bx--list__item", ["margin-top", "font-size"]],
      [
        ".bx--inline-notification__subtitle a",
        ["color", "text-decoration-line", "font-size"],
      ],
      [".bx--inline-notification__subtitle strong", ["font-size"]],
      [
        ".bx--snippet--inline code",
        ["background-color", "padding-left", "font-size", "border-radius"],
      ],
      [
        ".bx--snippet--single pre",
        ["background-color", "padding-top", "font-size", "overflow-x"],
      ],
    ];

    const pairs = cases.flatMap(([selector, properties]) =>
      properties.map(async (property) => ({
        label: `${selector} ${property}`,
        inside: await style(prose.locator(selector).first(), property),
        outside: await style(outside.locator(selector).first(), property),
      })),
    );

    for (const { label, inside, outside } of await Promise.all(pairs)) {
      expect(inside, label).toBe(outside);
    }
  });

  test("keeps table column alignment from the align attribute", async ({
    page,
  }) => {
    expect(await style(page.getByTestId("th-center"), "text-align")).toBe(
      "center",
    );
    expect(
      await style(page.getByRole("cell", { name: "6,204,118" }), "text-align"),
    ).toBe("right");
    expect(
      await style(page.getByRole("cell", { name: "us-east" }), "text-align"),
    ).toBe("start");
  });

  test("shows a heading anchor on hover and keyboard focus", async ({
    page,
  }) => {
    const anchor = page.getByTestId("heading-anchor");
    const heading = page.getByTestId("anchored-heading");

    expect(await style(anchor, "opacity")).toBe("0");
    await heading.hover();
    await expect.poll(() => style(anchor, "opacity")).toBe("1");

    await page.mouse.move(0, 0);
    await anchor.focus();
    await expect.poll(() => style(anchor, "opacity")).toBe("1");
    expect(await style(heading, "scroll-margin-top")).toBe("0px");
  });

  test("styles GitHub alerts from data-alert", async ({ page }) => {
    const note = page.getByTestId("alert-note");
    const outside = page
      .getByTestId("outside")
      .locator(".bx--inline-notification");

    expect(await style(note, "border-left-color")).toBe(
      await style(outside, "border-left-color"),
    );
    expect(await style(note, "background-color")).toBe(
      await style(outside, "background-color"),
    );
    expect(
      await note.evaluate((el) => getComputedStyle(el, "::before").content),
    ).toBe('"Note"');
  });

  test("puts a task list's checkbox in place of the bullet", async ({
    page,
  }) => {
    const item = page.getByTestId("task-li");
    const checkbox = item.getByRole("checkbox");
    const list = item.locator("..");

    expect(await style(item, "list-style-type")).toBe("none");
    const listBox = await list.boundingBox();
    const checkboxBox = await checkbox.boundingBox();
    expect(checkboxBox?.x).toBeCloseTo(listBox?.x ?? Number.NaN, 0);
  });

  test("condensed uses 12px copy and 16px top-level headings", async ({
    page,
  }) => {
    await page.goto("/prose.html?variant=condensed");

    expect(await style(page.getByTestId("raw-p"), "font-size")).toBe("12px");
    expect(
      await style(page.getByRole("heading", { level: 1 }), "font-size"),
    ).toBe("16px");
    expect(
      await style(
        page.getByRole("heading", { level: 3 }).first(),
        "font-weight",
      ),
    ).toBe("600");
  });

  test("styles a Prose nested in another with its own variant", async ({
    page,
  }) => {
    expect(await style(page.getByTestId("nested-p"), "font-size")).toBe("14px");
    expect(await style(page.getByTestId("nested-li"), "list-style-type")).toBe(
      "disc",
    );
  });

  test("compact uses 14px copy and smaller headings", async ({ page }) => {
    await page.goto("/prose.html?variant=compact");

    expect(await style(page.getByTestId("raw-p"), "font-size")).toBe("14px");
    expect(
      await style(page.getByRole("heading", { level: 1 }), "font-size"),
    ).toBe("28px");
  });
});
