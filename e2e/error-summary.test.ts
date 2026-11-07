import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { getAXTree } from "./helpers/ax-tree";
import { expect, test } from "./helpers/host";

/**
 * One entry per field type in the fixture. `within` names an element that
 * must hold the focused control (a group's wrapper); otherwise the focused
 * control has the id.
 */
const FIELDS: {
  type: string;
  id: string;
  /** The visible label or legend text; empty when the field shows none. */
  label: string;
  within?: string;
  /** Other ids the control may have: a range slider starts at its number input. */
  alsoId?: string;
  /** The control is a visually hidden native input, drawn by its label. */
  hidden?: boolean;
}[] = [
  { type: "TextInput", id: "field-text", label: "Text" },
  { type: "PasswordInput", id: "field-password", label: "Password" },
  { type: "TextArea", id: "field-textarea", label: "Text area" },
  { type: "NumberInput", id: "field-number", label: "Number" },
  { type: "Select", id: "field-select", label: "Select" },
  { type: "Dropdown", id: "field-dropdown", label: "Dropdown" },
  { type: "ComboBox", id: "field-combobox", label: "Combo box" },
  { type: "MultiSelect", id: "field-multiselect", label: "Multi select" },
  {
    type: "MultiSelect (filterable)",
    id: "field-multiselect-filterable",
    label: "Filterable multi select",
  },
  { type: "DatePicker (single)", id: "field-date", label: "Date" },
  {
    type: "DatePicker (range start)",
    id: "field-range-start",
    label: "Start date",
  },
  { type: "DatePicker (range end)", id: "field-range-end", label: "End date" },
  { type: "TimePicker", id: "field-time", label: "Time" },
  { type: "Slider", id: "field-slider", label: "Slider" },
  {
    type: "RangeSlider",
    id: "field-range-slider",
    alsoId: "lower-input-field-range-slider",
    label: "Range slider",
  },
  { type: "Toggle", id: "field-toggle", label: "Toggle", hidden: true },
  { type: "Checkbox", id: "field-checkbox", label: "Checkbox", hidden: true },
  {
    type: "CheckboxGroup",
    id: "field-checkbox-group",
    label: "Checkbox group",
    within: "#field-checkbox-group",
    hidden: true,
  },
  {
    type: "RadioButtonGroup",
    id: "field-radio-group",
    label: "Radio group",
    within: "#field-radio-group",
    hidden: true,
  },
  { type: "PinCodeInput", id: "field-pin", label: "Pin code" },
  { type: "TagInput", id: "field-tags", label: "Tags" },
  { type: "Search", id: "field-search", label: "" },
  { type: "InlineEdit", id: "field-inline-edit", label: "" },
];

const summaryLink = (page: Page, text: string) =>
  page.getByRole("link", { name: text, exact: true });

/** The label or legend with this exact text. */
const labelOf = (page: Page, text: string) =>
  page
    .locator("form label, form legend, form .bx--label")
    .filter({ hasText: new RegExp(`^${text}(\\s*(Off|On))*$`) })
    .first();

/** The id of the focused control, or "" when it has none. */
const focusedId = (page: Page) =>
  page.evaluate(() => document.activeElement?.id ?? "");

for (const mode of ["auto", "manual"] as const) {
  test.describe(`ErrorSummary, ${mode} errors`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/error-summary.html");
      await page.setViewportSize({ width: 1280, height: 720 });
      if (mode === "auto") await page.getByTestId("submit").click();
      else
        await page.getByRole("button", { name: "Submit with a list" }).click();
      await expect(page.locator(".bx--error-summary")).toBeFocused();
    });

    test("lists one link per field, in order", async ({ page }) => {
      await expect(page.locator(".bx--error-summary__link")).toHaveCount(
        FIELDS.length,
      );
      await expect(
        page.getByRole("heading", { name: `Fix ${FIELDS.length} errors` }),
      ).toBeVisible();
    });

    for (const field of FIELDS) {
      test(`${field.type}: the link focuses the control and shows its label`, async ({
        page,
      }) => {
        await summaryLink(
          page,
          `Enter ${field.id.slice("field-".length)}`,
        ).click();

        if (field.within) {
          const inside = await page.evaluate(
            (selector) =>
              !!document
                .querySelector(selector)
                ?.contains(document.activeElement) &&
              document.activeElement instanceof HTMLInputElement,
            field.within,
          );
          expect(inside).toBe(true);
        } else {
          expect([field.id, field.alsoId]).toContain(await focusedId(page));
        }

        if (!field.hidden)
          await expect(page.locator(":focus")).toBeInViewport();
        if (!field.label) return;
        const label = labelOf(page, field.label);
        await expect(label).toBeInViewport({ ratio: 0.9 });
        // The label sits at the top, below the 48px header `scrollMargin` clears.
        const top = await label.evaluate(
          (el) => el.getBoundingClientRect().top,
        );
        expect(top).toBeGreaterThanOrEqual(47);
        expect(top).toBeLessThan(200);
      });
    }
  });
}

test.describe("ErrorSummary keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/error-summary.html");
  });

  test("submit, read the summary, follow a link, and type in the field", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari does not Tab to links");
    await page.getByTestId("submit").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".bx--error-summary")).toBeFocused();

    // The summary takes Tab to its first link; it is not a tab stop itself.
    await page.keyboard.press("Tab");
    await expect(summaryLink(page, "Enter text")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(summaryLink(page, "Enter password")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");

    expect(await focusedId(page)).toBe("field-text");
    await page.keyboard.type("Ada");
    await expect(page.locator("#field-text")).toHaveValue("Ada");
  });

  test("a link of a group focuses its first control, and arrow keys move on", async ({
    page,
  }) => {
    await page.getByTestId("submit").focus();
    await page.keyboard.press("Enter");
    await summaryLink(page, "Enter radio-group").focus();
    await page.keyboard.press("Enter");

    await expect(
      page.locator("#field-radio-group input[type=radio]").first(),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.locator("#field-radio-group input[type=radio]").nth(1),
    ).toBeFocused();
  });

  test("a second failed submit takes focus back to the summary", async ({
    page,
  }) => {
    await page.getByTestId("submit").click();
    await summaryLink(page, "Enter text").click();
    await expect(page.locator("#field-text")).toBeFocused();

    await page.getByTestId("submit").click();

    await expect(page.locator(".bx--error-summary")).toBeFocused();
  });

  test("clearing the errors removes the summary", async ({ page }) => {
    await page.getByTestId("submit").click();
    await expect(page.locator(".bx--error-summary")).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();

    await expect(page.locator(".bx--error-summary")).toHaveCount(0);
  });
});

test.describe("ErrorSummary accessibility tree", () => {
  test("names the summary, and each field's error matches its link", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Reads Chromium's tree over CDP");
    await page.goto("/error-summary.html");
    await page.getByTestId("submit").click();
    await expect(page.locator(".bx--error-summary")).toBeFocused();

    const tree = await getAXTree(page);
    try {
      expect(await tree.query("group", "Fix 23 errors")).toHaveLength(1);
      expect(await tree.query("heading", "Fix 23 errors")).toHaveLength(1);
      expect(await tree.query("list", "")).not.toHaveLength(0);

      // The link reads as the field's own error, so the two agree.
      for (const [link, field] of [
        ["Enter text", "Text"],
        ["Enter password", "Password"],
        ["Enter date", "Date"],
      ] as const) {
        expect(await tree.query("link", link)).toHaveLength(1);
        const [control] = await tree.query("textbox", field);
        expect(control.invalid).toBe(true);
        expect(`${control.errorMessage} ${control.description}`).toContain(
          link,
        );
      }
    } finally {
      await tree.dispose();
    }
  });
});

/** Wait for the color transitions a theme or direction change starts. */
const settle = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .map((animation) => animation.finished.catch(() => {})),
    ),
  );

const THEMES = [
  { name: "White", apply: async (_page: Page) => {} },
  {
    name: "Gray 100",
    apply: (page: Page) =>
      page.evaluate(() => {
        document.documentElement.className = "bx--g100";
      }),
  },
  {
    name: "RTL",
    apply: (page: Page) =>
      page.evaluate(() => {
        document.documentElement.dir = "rtl";
      }),
  },
];

test.describe("ErrorSummary axe", () => {
  for (const theme of THEMES) {
    test(`has no violations, ${theme.name}`, async ({ page }) => {
      await page.goto("/error-summary-shown.html");
      await theme.apply(page);
      await settle(page);
      await expect(page.locator(".bx--error-summary")).toBeFocused();

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });

    test(`has no violations after a link jump, ${theme.name}`, async ({
      page,
    }) => {
      await page.goto("/error-summary.html");
      await theme.apply(page);
      await page.getByTestId("submit").click();
      await summaryLink(page, "Enter radio-group").click();
      await settle(page);

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("ErrorSummary shown on load", () => {
  test("takes focus on load, as after a server-rendered failure", async ({
    page,
  }) => {
    await page.goto("/error-summary-shown.html");

    await expect(page.locator(".bx--error-summary")).toBeFocused();
    await expect(page.locator(".bx--error-summary__link")).toHaveCount(5);
  });

  test("a link to a date picker input and to a radio group focus them", async ({
    page,
  }) => {
    await page.goto("/error-summary-shown.html");

    await summaryLink(page, "Enter your date of birth").click();
    expect(await focusedId(page)).toBe("birthday");
    await expect(labelOf(page, "Date of birth")).toBeInViewport();

    await summaryLink(page, "Choose a plan").click();
    await expect(page.locator("#plan input[type=radio]").first()).toBeFocused();
    await expect(labelOf(page, "Plan")).toBeInViewport();
  });
});

test.describe("ErrorSummary styles", () => {
  test("draws an error edge at the inline start, in each direction", async ({
    page,
  }) => {
    await page.goto("/error-summary-shown.html");
    const edges = () =>
      page.locator(".bx--error-summary").evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          left: style.borderLeftWidth,
          right: style.borderRightWidth,
          color: style.borderInlineStartColor,
        };
      });

    const ltr = await edges();
    expect([ltr.left, ltr.right]).toEqual(["3px", "1px"]);

    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const rtl = await edges();
    expect([rtl.left, rtl.right]).toEqual(["1px", "3px"]);
  });

  test("forced colors keep the edge, the links and the focus ring", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/error-summary-shown.html");
    await expect(page.locator(".bx--error-summary")).toBeFocused();

    const style = await page.evaluate(() => {
      const system = (name: string) => {
        const probe = document.createElement("div");
        probe.style.color = name;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      const summary = document.querySelector(
        ".bx--error-summary",
      ) as HTMLElement;
      const link = document.querySelector(
        ".bx--error-summary__link",
      ) as HTMLElement;
      const box = getComputedStyle(summary);
      const text = getComputedStyle(link);
      return {
        edgeWidth: box.borderInlineStartWidth,
        edgeStyle: box.borderInlineStartStyle,
        edgeColor: box.borderInlineStartColor,
        canvasText: system("CanvasText"),
        linkColor: text.color,
        linkText: system("LinkText"),
        underline: text.textDecorationLine,
        outlineStyle: box.outlineStyle,
        outlineWidth: box.outlineWidth,
      };
    });

    expect(style.edgeWidth).toBe("3px");
    expect(style.edgeStyle).toBe("solid");
    expect(style.edgeColor).toBe(style.canvasText);
    expect(style.linkColor).toBe(style.linkText);
    expect(style.underline).toBe("underline");
    expect(style.outlineStyle).toBe("solid");
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  });

  test("a long message wraps inside a narrow view", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/error-summary-shown.html");

    const box = await page.locator(".bx--error-summary").boundingBox();
    expect(box?.width).toBeLessThanOrEqual(320);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
