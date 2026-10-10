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
      [".bx--type-body-01", ["font-size", "line-height"]],
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
    expect(
      await style(
        page.locator('blockquote[data-alert="important"]'),
        "border-left-color",
      ),
    ).not.toBe(await style(note, "border-left-color"));
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

  test("condensed uses 14px copy on 18px lines and 20px top-level headings", async ({
    page,
  }) => {
    await page.goto("/prose.html?variant=condensed");

    expect(await style(page.getByTestId("raw-p"), "font-size")).toBe("14px");
    expect(
      Number.parseFloat(await style(page.getByTestId("raw-p"), "line-height")),
    ).toBeCloseTo(18, 1);
    expect(
      await style(page.getByRole("heading", { level: 1 }), "font-size"),
    ).toBe("20px");
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

  test("sets link tone per root", async ({ page }) => {
    const linkBlue = await style(page.getByTestId("raw-link"), "color");
    expect(await style(page.getByTestId("heading-anchor"), "color")).toBe(
      linkBlue,
    );
    expect(await style(page.getByTestId("muted-link"), "color")).toBe(
      await style(page.getByTestId("raw-p"), "color"),
    );
    expect(
      await style(page.getByTestId("muted-link"), "text-decoration-line"),
    ).toBe("underline");
    expect(await style(page.getByTestId("muted-anchor"), "color")).not.toBe(
      linkBlue,
    );
    expect(await style(page.getByTestId("nested-default-link"), "color")).toBe(
      linkBlue,
    );
  });

  test("spaces headings by level and copy after a component", async ({
    page,
  }) => {
    const margin = (locator) => style(locator, "margin-top");
    expect(await margin(page.getByRole("heading", { name: "Setup" }))).toBe(
      "64px",
    );
    expect(await margin(page.getByRole("heading", { name: "Request" }))).toBe(
      "40px",
    );
    expect(await margin(page.getByTestId("after-snippet"))).toBe("32px");
  });

  test("separates stacked headings and sets tables apart from copy", async ({
    page,
  }) => {
    const margin = (testId) => style(page.getByTestId(testId), "margin-top");
    expect(await margin("stacked-heading")).toBe("24px");
    expect(await margin("block-table")).toBe("32px");
    expect(await margin("after-table")).toBe("32px");
    expect(await margin("block-figure")).toBe("32px");
    expect(await margin("table-after-heading")).toBe("12px");
  });

  test("spaces Prose runs and examples in a flow container", async ({
    page,
  }) => {
    const flow = page.getByTestId("flow");
    expect(
      await style(flow.locator(":scope > .bx--snippet"), "margin-top"),
    ).toBe("16px");
    expect(
      await style(page.getByTestId("flow-after-component"), "margin-top"),
    ).toBe("32px");
    // The heading's margin collapses through its root into the gap.
    const previous = await page
      .getByTestId("flow-after-component")
      .boundingBox();
    const heading = await page
      .getByTestId("flow-heading")
      .getByRole("heading")
      .boundingBox();
    expect(
      (heading?.y ?? 0) - ((previous?.y ?? 0) + (previous?.height ?? 0)),
    ).toBeCloseTo(64, 0);
  });

  test("fits tables to their content with flush edges by default", async ({
    page,
  }) => {
    const firstHeader = page
      .getByRole("columnheader", { name: "Region" })
      .first();
    const fitTable = firstHeader.locator("xpath=ancestor::table");
    const proseWidth = (await page.getByTestId("prose").boundingBox())?.width;
    expect((await fitTable.boundingBox())?.width).toBeLessThan(proseWidth ?? 0);
    expect(await style(firstHeader, "padding-left")).toBe("0px");
    expect(await style(page.getByTestId("th-center"), "padding-left")).toBe(
      "32px",
    );

    const fullTable = page.getByTestId("full-table");
    expect((await fullTable.boundingBox())?.width).toBeCloseTo(
      (await page.getByTestId("full-table-prose").boundingBox())?.width ?? 0,
      0,
    );
    expect(await style(page.getByTestId("full-first"), "padding-left")).toBe(
      "0px",
    );
  });

  test("keeps inline details from moving lines", async ({ page }) => {
    const sup = page.getByTestId("footnote-ref").locator("..");
    expect(await style(sup, "line-height")).toBe("0px");
    expect(
      await style(page.getByTestId("footnote-ref"), "text-decoration-line"),
    ).toBe("none");
    expect(await style(page.getByTestId("footnotes"), "font-size")).toBe(
      "14px",
    );
    expect(await style(page.getByTestId("raw-code"), "padding-left")).toBe(
      "2.8px",
    );
    expect(await style(page.getByTestId("summary"), "cursor")).toBe("pointer");
    expect(await style(page.getByTestId("nested-list"), "margin-top")).toBe(
      "8px",
    );
  });

  test("steps code surfaces up on a Layer", async ({ page }) => {
    const background = (testId: string) =>
      style(page.getByTestId(testId), "background-color");
    const [pagePre, layerPre, pageCode, layerCode] = await Promise.all(
      ["page-pre", "layer-pre", "raw-code", "layer-code"].map(background),
    );
    expect(layerPre).not.toBe(pagePre);
    expect(layerCode).not.toBe(pageCode);
  });

  test("puts list indents, quote borders and table edges at the start in RTL", async ({
    page,
  }) => {
    const list = page.getByTestId("rtl-ul");
    const quote = page.getByTestId("rtl-quote");
    const first = page.getByTestId("rtl-first");
    expect(await style(list, "padding-right")).toBe("24px");
    expect(await style(list, "padding-left")).toBe("0px");
    expect(await style(quote, "border-right-width")).toBe("4px");
    expect(await style(quote, "border-left-width")).toBe("0px");
    expect(await style(first, "padding-right")).toBe("0px");
    expect(await style(first, "text-align")).toBe("start");
    expect(await style(page.getByTestId("rtl-pre"), "direction")).toBe("ltr");
  });

  test("shows the link focus ring, as Link does", async ({ page }) => {
    const link = page.getByTestId("raw-link");
    await link.focus();
    expect(await style(link, "outline-style")).toBe("solid");
    expect(await style(link, "outline-width")).toBe("1px");
    const focus = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--cds-focus)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(await style(link, "outline-color")).toBe(focus);
  });

  test("steps code in an alert up from the alert's surface", async ({
    page,
  }) => {
    // Each alert's background and its code's, under a theme.
    const surfaces = (theme: string) =>
      page.evaluate((theme) => {
        document.documentElement.setAttribute("theme", theme);
        const background = (selector: string) =>
          getComputedStyle(document.querySelector(selector) as Element)
            .backgroundColor;
        return {
          warning: background('blockquote[data-alert="warning"]'),
          code: background('[data-testid="alert-code"]'),
          pre: background('[data-testid="alert-pre"]'),
          layerAlert: background('[data-testid="layer-alert"]'),
          layerPre: background('[data-testid="layer-alert-pre"]'),
        };
      }, theme);

    const white = await surfaces("white");
    const g100 = await surfaces("g100");
    for (const [theme, s] of Object.entries({ white, g100 })) {
      expect(s.code, theme).not.toBe(s.warning);
      expect(s.pre, theme).not.toBe(s.warning);
      expect(s.layerPre, theme).not.toBe(s.layerAlert);
    }
  });

  test("steps alerts up on a Layer in dark themes", async ({ page }) => {
    const notes = (theme: string | null) =>
      page.evaluate((theme) => {
        const root = document.documentElement;
        if (theme) root.setAttribute("theme", theme);
        else root.removeAttribute("theme");
        return ["alert-note", "layer-alert"].map(
          (testId) =>
            getComputedStyle(
              document.querySelector(`[data-testid="${testId}"]`) as Element,
            ).backgroundColor,
        );
      }, theme);

    // A page with no theme is White: alerts keep their tint.
    expect(await notes(null)).toEqual([
      "rgb(237, 245, 255)",
      "rgb(237, 245, 255)",
    ]);
    expect(await notes("g100")).toEqual(["rgb(38, 38, 38)", "rgb(57, 57, 57)"]);
  });

  test("spaces a nested Prose evenly and inline components as copy", async ({
    page,
  }) => {
    const box = (testId: string) =>
      page.getByTestId(testId).boundingBox() as Promise<{
        y: number;
        height: number;
      }>;
    const [before, nested, after] = await Promise.all(
      ["before-nested", "nested-gaps", "after-nested"].map(box),
    );
    expect(nested.y - (before.y + before.height)).toBeCloseTo(
      after.y - (nested.y + nested.height),
      0,
    );
    expect(await style(page.getByTestId("after-inline"), "margin-top")).toBe(
      "16px",
    );
    // Text is copy whatever its tag, not a block component.
    expect(await style(page.getByTestId("after-text"), "margin-top")).toBe(
      "16px",
    );
    expect(await style(page.getByTestId("after-text-div"), "margin-top")).toBe(
      "16px",
    );
  });

  test("draws no divider above a first heading", async ({ page }) => {
    const border = (testId: string) =>
      style(page.getByTestId(testId), "border-top-width");
    expect(await border("first-divided")).toBe("0px");
    expect(await border("second-divided")).toBe("1px");
  });

  for (const variant of [
    "condensed",
    "compact",
    "default",
    "spacious",
    "expressive",
  ]) {
    test(`sets ${variant} h5 and h6 at the body size, in semibold`, async ({
      page,
    }) => {
      await page.goto(`/prose.html?variant=${variant}`);
      const body = Number.parseFloat(
        await style(page.getByTestId("raw-p"), "font-size"),
      );
      const headings = await Promise.all(
        ["h5", "h6"].map(async (testId) => {
          const heading = page.getByTestId(testId);
          return [
            Number.parseFloat(await style(heading, "font-size")),
            await style(heading, "font-weight"),
          ];
        }),
      );
      expect(headings).toEqual([
        [body, "600"],
        [body, "600"],
      ]);
    });
  }

  test("skips rendering offscreen code blocks with deferOffscreen", async ({
    page,
  }) => {
    // A skipped block keeps its own box; what it skips is its content.
    const rendered = (testId: string) =>
      page
        .getByTestId(testId)
        .locator(":scope > *")
        .first()
        .evaluate((el) => el.checkVisibility({ contentVisibilityAuto: true }));

    expect(await rendered("deferred-pre")).toBe(false);
    // Paint containment would clip a table's overflow, so tables render.
    expect(await rendered("deferred-table")).toBe(true);
    await page.getByTestId("deferred-pre").scrollIntoViewIfNeeded();
    await expect.poll(() => rendered("deferred-pre")).toBe(true);
  });

  test("compact uses 14px copy and smaller headings", async ({ page }) => {
    await page.goto("/prose.html?variant=compact");

    expect(await style(page.getByTestId("raw-p"), "font-size")).toBe("14px");
    expect(
      await style(page.getByRole("heading", { level: 1 }), "font-size"),
    ).toBe("28px");
  });
});
