import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const open = (page: Page, query = "") =>
  page.goto(`/data-table-stacked.html?${query}`);

/** Whether the rows are cards: the header row is gone from the layout. */
const isStacked = (page: Page) =>
  page
    .locator("thead")
    .first()
    .evaluate((el) => getComputedStyle(el).display === "none");

const FEATURES = [
  "primary",
  "actions",
  "sort",
  "select",
  "batch",
  "radio",
  "expand",
  "batchExpand",
  "sticky",
  "zebra",
  "toolbar",
  "highlight",
  "cellSlot",
  "hidden",
  "hiddenColumn",
  "stackedLabel",
  "align",
  "footer",
  "page",
  "virtualize",
  "static",
  "fixed",
  "nonSelectable",
  "nonExpandable",
  "preselect",
];

test.describe("DataTable stacked: container widths", () => {
  // The query is on the table's own box, so the viewport stays wide.
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  for (const [width, breakpoint, stacked] of [
    [320, "md", true],
    [671, "md", true],
    [672, "md", false],
    [1056, "md", false],
    [320, "lg", true],
    [1055, "lg", true],
    [1056, "lg", false],
  ] as const) {
    test(`auto at ${width}px with bp=${breakpoint} is ${stacked ? "cards" : "a table"}`, async ({
      page,
    }) => {
      await open(page, `w=${width}px&bp=${breakpoint}&f=primary,actions`);
      expect(await isStacked(page)).toBe(stacked);
    });
  }

  test("always stacks a wide box, and never keeps a narrow one a table", async ({
    page,
  }) => {
    await open(page, "w=1056px&stacked=always");
    expect(await isStacked(page)).toBe(true);

    await open(page, "w=320px&stacked=never");
    expect(await isStacked(page)).toBe(false);
    await expect(page.locator("td[data-label]")).toHaveCount(0);
  });

  test("the box decides, not the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await open(page, "w=900px");
    expect(await isStacked(page)).toBe(false);
  });

  test("a resize across the breakpoint flips the layout with no script", async ({
    page,
  }) => {
    await open(page, "w=800px&f=primary");
    expect(await isStacked(page)).toBe(false);
    await page
      .getByTestId("stacked-root")
      .evaluate((el) => (el.style.width = "400px"));
    expect(await isStacked(page)).toBe(true);
  });

  test("a label shows above its value, and the primary cell has none", async ({
    page,
  }) => {
    await open(page, "w=400px&f=primary,actions,stackedLabel,hidden");
    const row = page.locator("tbody tr").first();
    const labels = await row.locator("td").evaluateAll((cells) =>
      cells.map((cell) => {
        const before = getComputedStyle(cell, "::before");
        return {
          display: getComputedStyle(cell).display,
          content: before.content,
        };
      }),
    );
    expect(labels.map((l) => l.content)).toEqual([
      "none",
      '"Protocol"',
      '"Port number"',
      '"Status"',
      '"Rule"',
      "none",
    ]);
    // The hidden column keeps its cell but not its box.
    expect(labels[4].display).toBe("none");
  });

  test("a table that is not stacked shows no labels", async ({ page }) => {
    await open(page, "w=900px&f=primary");
    const content = await page
      .locator("tbody td")
      .nth(1)
      .evaluate((el) => getComputedStyle(el, "::before").content);
    expect(["none", "normal"]).toContain(content);
    await expect(page.locator(".bx--data-table-stacked-controls")).toBeHidden();
  });

  test("a card leads with its select, expand, title and actions on one line", async ({
    page,
  }) => {
    await open(page, "w=400px&f=primary,actions,select,expand");
    const boxes = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .evaluateAll((cells) =>
        cells.map((cell) => {
          const r = cell.getBoundingClientRect();
          return {
            top: Math.round(r.top),
            left: r.left,
            right: r.right,
            w: r.width,
          };
        }),
      );
    // expand, select, name, protocol, port, status, actions (DOM order)
    const [expand, select, name, protocol, , status, actions] = boxes;
    const card = await page
      .locator("tbody tr")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(select.top).toBe(expand.top);
    expect(name.top).toBe(expand.top);
    expect(actions.top).toBe(expand.top);
    expect(expand.left).toBeLessThan(select.left);
    expect(select.left).toBeLessThan(name.left);
    expect(name.left).toBeLessThan(actions.left);
    expect(protocol.top).toBeGreaterThan(name.top);
    expect(status.top).toBeGreaterThan(protocol.top);
    // The rest take a line of the card each.
    expect(Math.abs(protocol.w - (card - 2))).toBeLessThan(2);
  });

  test("mirrors for RTL", async ({ page }) => {
    await open(page, "w=400px&f=primary,actions,select,expand");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const lefts = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .evaluateAll((cells) => cells.map((c) => c.getBoundingClientRect().left));
    // expand, select, name ... actions run right to left.
    expect(lefts[0]).toBeGreaterThan(lefts[1]);
    expect(lefts[1]).toBeGreaterThan(lefts[2]);
    expect(lefts[2]).toBeGreaterThan(lefts[6]);
  });

  test("a selected card's label and title keep to the highlight's text color in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "w=400px&f=primary,select,preselect");
    const colors = await page
      .locator("tr.bx--data-table--selected")
      .evaluate((row) => {
        const [title, protocol] = [...row.querySelectorAll("td[data-label]")];
        return {
          title: getComputedStyle(title).color,
          label: getComputedStyle(protocol, "::before").color,
          value: getComputedStyle(protocol).color,
        };
      });
    expect(colors.label).toBe(colors.value);
    expect(colors.title).toBe(colors.value);
  });

  test("a card is bordered in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "w=400px&f=primary,select,preselect");
    const tr = page.locator("tbody tr").first();
    const style = await tr.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        width: cs.borderTopWidth,
        color: cs.borderTopColor,
        background: cs.backgroundColor,
      };
    });
    expect(style.width).toBe("1px");
    expect(style.color).not.toBe(style.background);
  });
});

test.describe("DataTable stacked: interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test("selects a row from its card", async ({ page }) => {
    await open(page, "w=400px&f=primary,select");
    await page
      .locator("tbody tr")
      .nth(1)
      .locator("label.bx--checkbox-label")
      .click();
    await expect(page.getByTestId("selected")).toHaveText("row-1");
  });

  test("selects every card from the bar that holds select all", async ({
    page,
  }) => {
    await open(page, "w=400px&f=primary,batch");
    // The header's own checkbox is hidden with the header.
    await expect(page.locator("thead input[type=checkbox]")).toBeHidden();
    const selectAll = page.locator(
      "label[for$=stacked-select-all].bx--checkbox-label",
    );
    await selectAll.click();
    await expect(page.getByTestId("selected")).toHaveText(
      "row-0,row-1,row-2,row-3,row-4,row-5",
    );
    await selectAll.click();
    await expect(page.getByTestId("selected")).toHaveText("");
  });

  test("sorts from a select", async ({ page }) => {
    await open(page, "w=400px&f=primary,sort");
    await page.getByRole("combobox", { name: "Sort by" }).selectOption({
      label: "Port number, descending".replace("Port number", "Port"),
    });
    await expect(page.getByTestId("sort-events")).toHaveText("1");
    await expect(
      page.locator("tbody tr").first().locator("td").first(),
    ).toHaveText("Load balancer 6");
    await page
      .getByRole("combobox", { name: "Sort by" })
      .selectOption({ index: 0 });
    await expect(
      page.locator("tbody tr").first().locator("td").first(),
    ).toHaveText("Load balancer 1");
  });

  test("an expanded row opens inside its card", async ({ page }) => {
    await open(page, "w=400px&f=primary,expand");
    await expect(page.locator("tr[data-child-row]").first()).toBeHidden();
    await page
      .getByRole("button", { name: "Expand current row" })
      .first()
      .click();
    const detail = page.getByTestId("expanded-detail");
    await expect(detail).toBeVisible();
    const gap = await page.evaluate(() => {
      const parent = document.querySelector("tr[data-parent-row]")!;
      const child = document.querySelector("tr[data-child-row]")!;
      return (
        child.getBoundingClientRect().top -
        parent.getBoundingClientRect().bottom
      );
    });
    // Border to border: no gap between the halves.
    expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  });

  test("expand all moves to the bar", async ({ page }) => {
    await open(page, "w=400px&f=primary,batchExpand");
    await page.getByRole("button", { name: "Expand all rows" }).last().click();
    await expect(page.getByTestId("expanded-detail")).toHaveCount(6);
  });

  test("has no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await open(page, "f=primary,actions,select,expand,sort,batch");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe("DataTable stacked: semantics", () => {
  test("keeps the table, row and cell roles", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "w=400px&f=primary,actions,select");
    expect(await isStacked(page)).toBe(true);

    const table = page.getByRole("table", { name: "Load balancers" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(7); // + the footer row
    await expect(table.getByRole("rowgroup").first()).toBeVisible();
    await expect(
      table.getByRole("row").first().getByRole("cell").first(),
    ).toBeVisible();

    // A cell reads its label with its value.
    await expect(
      table
        .getByRole("row")
        .first()
        .getByRole("cell", { name: /Protocol/ }),
    ).toContainText("HTTP");
  });

  test("Playwright's snapshot of the table reads rows of cells", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "w=400px&rows=2&f=primary");
    const snapshot = await page
      .getByRole("table", { name: "Load balancers" })
      .ariaSnapshot();
    expect(snapshot).toContain("- table");
    expect(snapshot).toContain("- rowgroup");
    expect(snapshot).toContain("- row");
    expect(snapshot).toContain("- cell");
  });

  test("the browser's own tree has the table and its rows", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "CDP is Chromium only");
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "w=400px&rows=2&f=primary,actions");
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = (await cdp.send("Accessibility.getFullAXTree")) as {
      nodes: {
        ignored: boolean;
        role?: { value: string };
        name?: { value: string };
      }[];
    };
    const roles = (role: string) =>
      nodes.filter((n) => !n.ignored && n.role?.value === role);
    const table = roles("table");
    expect(table.map((n) => n.name?.value)).toContain("Load balancers");
    // Two body rows and the footer; the header row is not in the layout.
    expect(roles("row").length).toBe(3);
    expect(roles("columnheader")).toHaveLength(0);
    expect(roles("cell").length).toBeGreaterThanOrEqual(2 * 5);
    // A wide table has its header row back.
    await page.evaluate(() => {
      (
        document.querySelector("[data-testid=stacked-root]") as HTMLElement
      ).style.width = "1000px";
    });
    const { nodes: wide } = (await cdp.send("Accessibility.getFullAXTree")) as {
      nodes: { ignored: boolean; role?: { value: string } }[];
    };
    expect(
      wide.filter((n) => !n.ignored && n.role?.value === "columnheader").length,
    ).toBeGreaterThan(0);
    await cdp.detach();
  });

  for (const [theme, label] of [
    ["white", "White"],
    ["g100", "Gray 100"],
  ] as const) {
    test(`has no axe violations in ${label}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(
        page,
        "w=400px&f=primary,actions,select,batch,sort,expand,cellSlot,zebra",
      );
      await page.evaluate(
        (t) => document.documentElement.setAttribute("theme", t),
        theme,
      );
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no axe violations in RTL", async ({ page }) => {
    await open(page, "w=400px&f=primary,actions,select,batch,sort,expand");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("DataTable stacked: feature matrix", () => {
  // Every feature on its own, then the pairs the layout could break, then
  // all of them, each stacked at 320px.
  const PAIRS = [
    ["select", "expand"],
    ["batch", "expand"],
    ["radio", "expand"],
    ["sticky", "select"],
    ["sticky", "sort"],
    ["virtualize", "sticky"],
    ["zebra", "select"],
    ["zebra", "expand"],
    ["highlight", "select"],
    ["toolbar", "batch"],
    ["page", "sort"],
    ["fixed", "static"],
    ["hidden", "hiddenColumn"],
    ["align", "actions"],
  ];
  const combos: string[][] = [
    [],
    ...FEATURES.map((f) => [f]),
    ...PAIRS,
    FEATURES.filter((f) => !["radio", "virtualize"].includes(f)),
  ];

  for (const stacked of ["auto", "always"]) {
    for (const combo of combos) {
      test(`${stacked}: ${combo.join("+") || "plain"}`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 });
        await open(
          page,
          `stacked=${stacked}&f=${["primary", ...combo].join(",")}${combo.includes("page") ? "&rows=6" : ""}`,
        );
        expect(await isStacked(page)).toBe(true);

        const read = await page.evaluate(() => {
          const root = document.documentElement;
          const container = document.querySelector(
            "[data-testid=stacked-root]",
          )!;
          const cards = [
            ...container.querySelectorAll("tbody tr:not([data-child-row])"),
          ];
          const bounds = container.getBoundingClientRect();
          return {
            overflow: root.scrollWidth - root.clientWidth,
            cards: cards.length,
            // A cell that runs past its card, which is on the page.
            spill: cards.flatMap((card) => {
              const box = card.getBoundingClientRect();
              return [...card.querySelectorAll("td")]
                .filter((td) => getComputedStyle(td).display !== "none")
                .filter((td) => {
                  const r = td.getBoundingClientRect();
                  return r.right > box.right + 1 || r.left < box.left - 1;
                })
                .map((td) => td.textContent?.trim());
            }),
            outside: cards.filter((card) => {
              const r = card.getBoundingClientRect();
              return r.right > bounds.right + 1 || r.left < bounds.left - 1;
            }).length,
          };
        });
        expect(read.overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
        expect(read.spill, "cells past their card").toEqual([]);
        expect(read.outside, "cards past the table").toBe(0);
        expect(read.cards).toBe(combo.includes("page") ? 3 : 6);

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
