import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectNoPageOverflow } from "./helpers/layout";

const checkedIndexes = (matrix: Locator) =>
  matrix
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll<HTMLInputElement>("input")].findIndex(
          (input) => input.checked,
        ),
      ),
    );

test.describe("LikertMatrix", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/likert-matrix.html");
    await page.evaluate(() => document.fonts.ready);
  });

  test("aligns each column heading over its radios", async ({ page }) => {
    const matrix = page.getByTestId("stress");
    const centers = await matrix.evaluate((node) => {
      const center = (element: Element) => {
        const { x, width } = element.getBoundingClientRect();
        return Math.round(x + width / 2);
      };
      const headings = [
        ...node.querySelectorAll("thead th.bx--likert-matrix__heading"),
      ].map(center);
      const marks = [
        ...node.querySelectorAll(
          "tbody tr:last-child .bx--likert-matrix__mark",
        ),
      ].map(center);
      return { headings, marks };
    });

    expect(centers.headings).toHaveLength(7);
    for (const [index, heading] of centers.headings.entries()) {
      expect(Math.abs(heading - centers.marks[index])).toBeLessThanOrEqual(1);
    }
  });

  test("answers a statement by clicking its radio, one row at a time", async ({
    page,
  }) => {
    const matrix = page.getByTestId("onboarding");
    const marks = matrix
      .locator("tbody tr")
      .nth(0)
      .locator(".bx--likert-matrix__mark");
    await marks.nth(3).click();
    await matrix
      .locator("tbody tr")
      .nth(2)
      .locator(".bx--likert-matrix__mark")
      .nth(0)
      .click();
    await marks.nth(4).click();

    expect(await checkedIndexes(matrix)).toEqual([4, -1, 0]);
    await expect(page.getByTestId("answers")).toHaveText(
      '{"signup":5,"import":1}',
    );
  });

  test("has one tab stop a row and moves within a row with the arrow keys", async ({
    page,
  }) => {
    const matrix = page.getByTestId("onboarding");
    const rows = matrix.locator("tbody tr");
    // WebKit on macOS doesn't tab to radios by default.
    await rows.nth(0).getByRole("radio").first().focus();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await checkedIndexes(matrix)).toEqual([2, -1, -1]);

    await page.keyboard.press("Tab");
    await expect(rows.nth(0).locator(":focus")).toHaveCount(0);
  });

  test("names each radio by its statement and column", async ({ page }) => {
    const row = page.getByTestId("onboarding").locator("tbody tr").nth(1);
    await expect(row).toMatchAriaSnapshot(`
      - row /Inviting my team was easy/:
        - rowheader "Inviting my team was easy."
        - cell /Strongly disagree/:
          - radio "Inviting my team was easy. Strongly disagree"
        - cell /Disagree/:
          - radio "Inviting my team was easy. Disagree"
        - cell /Neither/:
          - radio "Inviting my team was easy. Neither agree nor disagree"
        - cell /Agree/:
          - radio "Inviting my team was easy. Agree"
        - cell /Strongly agree/:
          - radio "Inviting my team was easy. Strongly agree"
    `);
    await expect(
      page.getByTestId("onboarding").getByRole("group", {
        name: "How much do you agree with each statement about setting up?",
      }),
    ).toBeVisible();
  });

  test("stacks a 7-point matrix of 10 statements into cards at 320px", async ({
    page,
  }) => {
    const matrix = page.getByTestId("stress");
    await page.setViewportSize({ width: 320, height: 720 });

    const layout = await matrix.evaluate((node) => {
      const display = (selector: string) =>
        getComputedStyle(node.querySelector(selector) as Element).display;
      const row = node.querySelector("tbody tr") as HTMLElement;
      const cells = [...row.querySelectorAll("td")].map((cell) =>
        cell.getBoundingClientRect(),
      );
      const label = node.querySelector(
        ".bx--likert-matrix__point",
      ) as HTMLElement;
      return {
        row: display("tbody tr"),
        cellTops: new Set(cells.map((cell) => Math.round(cell.top))).size,
        cellCount: cells.length,
        labelVisible: label.getBoundingClientRect().width > 1,
        // Every radio is 44px tall: a touch target.
        minHeight: Math.min(
          ...[...node.querySelectorAll(".bx--likert-matrix__option")].map(
            (option) => option.getBoundingClientRect().height,
          ),
        ),
      };
    });

    expect(layout.row).toBe("block");
    expect(layout.cellTops).toBe(layout.cellCount);
    expect(layout.labelVisible).toBe(true);
    expect(layout.minHeight).toBeGreaterThanOrEqual(44);
    await expectNoPageOverflow(page);
  });

  test("keeps the table at a width that fits it, and stacks below", async ({
    page,
  }) => {
    const matrix = page.getByTestId("onboarding");
    const display = () =>
      matrix
        .locator("tbody tr")
        .first()
        .evaluate((row) => getComputedStyle(row).display);

    // Five points need 192px + 5 x 72px = 552px.
    await page.setViewportSize({ width: 600, height: 720 });
    expect(await display()).toBe("table-row");

    await page.setViewportSize({ width: 500, height: 720 });
    expect(await display()).toBe("block");
  });

  test("starts at the right under RTL and follows the arrow keys", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const matrix = page.getByTestId("onboarding");
    const row = matrix.locator("tbody tr").first();
    const xs = await row
      .locator(".bx--likert-matrix__mark")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().x),
      );
    expect(xs[0]).toBeGreaterThan(xs[4]);

    await row.getByRole("radio").nth(1).focus();
    await page.keyboard.press("ArrowLeft");
    expect(await checkedIndexes(matrix)).toEqual([2, -1, -1]);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await checkedIndexes(matrix)).toEqual([0, -1, -1]);
  });

  test("draws a checked radio as a dot a forced palette keeps", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const dot = await page
      .getByTestId("invalid")
      .locator(".bx--likert-matrix__input:checked + .bx--likert-matrix__mark")
      .evaluate((mark) => {
        const style = getComputedStyle(mark, "::before");
        const probe = document.createElement("div");
        document.body.append(probe);
        probe.style.backgroundColor = "ButtonText";
        const buttonText = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { background: style.backgroundColor, buttonText };
      });

    expect(dot.background).toBe(dot.buttonText);
  });

  test("marks a statement that needs an answer", async ({ page }) => {
    const row = page.getByTestId("invalid").locator("tbody tr").nth(1);

    await expect(row.getByRole("radio").first()).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    const border = await row
      .locator("th")
      .evaluate((cell) => getComputedStyle(cell).borderInlineStartWidth);
    expect(border).toBe("3px");
  });

  test("resets with its form", async ({ page }) => {
    const matrix = page.getByTestId("onboarding");
    await matrix
      .locator("tbody tr")
      .nth(0)
      .locator(".bx--likert-matrix__mark")
      .nth(2)
      .click();
    await expect(page.getByTestId("answers")).toHaveText('{"signup":3}');

    await page.getByTestId("reset").click();

    await expect(page.getByTestId("answers")).toHaveText("{}");
    expect(await checkedIndexes(matrix)).toEqual([-1, -1, -1]);
  });

  test("has no detectable accessibility violations, wide and narrow", async ({
    page,
  }) => {
    const wide = await new AxeBuilder({ page }).include("#app").analyze();
    expect(wide.violations).toEqual([]);

    await page.setViewportSize({ width: 320, height: 720 });
    const narrow = await new AxeBuilder({ page }).include("#app").analyze();
    expect(narrow.violations).toEqual([]);
  });
});

test("has no accessibility violations in Gray 100", async ({ page }) => {
  await page.goto("/likert-matrix.html");
  // A theme switch fades colors, and axe would read one mid-fade.
  await page.addStyleTag({ content: "*{transition:none!important}" });
  await page.evaluate(() => document.documentElement.classList.add("bx--g100"));

  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
});
