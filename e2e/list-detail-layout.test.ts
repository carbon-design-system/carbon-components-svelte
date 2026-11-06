import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { findLayoutProblems } from "./helpers/layout";

const open = (page: Page, query = "") =>
  page.goto(`/list-detail-layout.html?${query.replace(/^\?/, "")}`);

const frame = (page: Page) => page.getByTestId("frame");
const list = (page: Page) => page.locator(".bx--list-detail__list");
const detail = (page: Page) => page.locator(".bx--list-detail__detail");
const back = (page: Page) => page.getByRole("button", { name: "Back to list" });
const ticket = (page: Page, id: number) =>
  page.getByRole("link", { name: new RegExp(`^Ticket ${id}:`) });

async function widthOf(page: Page, width: number) {
  await frame(page).evaluate((el, w) => {
    el.style.width = `${w}px`;
  }, width);
}

test.describe("ListDetailLayout", () => {
  test.describe("two panes", () => {
    test.beforeEach(async ({ page }) => {
      await open(page, "?width=900px");
    });

    test("shows the list beside an empty state, with a divider", async ({
      page,
    }) => {
      await expect(list(page)).toBeVisible();
      await expect(detail(page)).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Select a ticket" }),
      ).toBeVisible();
      await expect(back(page)).toBeHidden();
      await expect(
        page.getByRole("separator", { name: "Resize list" }),
      ).toBeVisible();

      const l = await list(page).boundingBox();
      const d = await detail(page).boundingBox();
      if (!l || !d) throw new Error("missing box");
      expect(l.x + l.width).toBeLessThanOrEqual(d.x + 1);
      // 30% of 900px, held at the 280px minimum or above.
      expect(l.width).toBeGreaterThanOrEqual(270);
    });

    test("selects in place and leaves focus in the list", async ({ page }) => {
      await ticket(page, 3).click();

      await expect(
        page.getByRole("heading", { name: "Ticket 3: Dark theme contrast" }),
      ).toBeVisible();
      await expect(ticket(page, 3)).toHaveAttribute("aria-current", "true");
      await expect(ticket(page, 3)).toBeFocused();
      await expect(page.getByRole("status")).toHaveText(
        "Ticket 3: Dark theme contrast",
      );
      expect(new URL(page.url()).searchParams.get("id")).toBe("3");
    });

    test("scrolls the details back to the top for a new item", async ({
      page,
    }) => {
      await ticket(page, 3).click();
      const pane = page.locator(".bx--splitter__pane--end");
      await pane.evaluate((el) => {
        el.scrollTop = 50;
      });
      await ticket(page, 4).click();
      await expect.poll(() => pane.evaluate((el) => el.scrollTop)).toBe(0);
    });
  });

  test.describe("one pane", () => {
    test.beforeEach(async ({ page }) => {
      await open(page, "?width=500px");
    });

    test("shows the list alone until something is selected", async ({
      page,
    }) => {
      await expect(list(page)).toBeVisible();
      await expect(detail(page)).toBeHidden();
      await expect(page.getByRole("separator")).toHaveCount(0);

      await ticket(page, 2).click();

      await expect(list(page)).toBeHidden();
      await expect(detail(page)).toBeVisible();
      await expect(back(page)).toBeVisible();
    });

    test("moves focus to the heading, and Back returns it to the item", async ({
      page,
    }) => {
      await ticket(page, 2).click();
      await expect(
        page.getByRole("heading", { name: "Ticket 2: Export hangs" }),
      ).toBeFocused();

      await back(page).click();

      await expect(list(page)).toBeVisible();
      await expect(ticket(page, 2)).toBeFocused();
      await expect(ticket(page, 2)).not.toHaveAttribute("aria-current");
      await expect.poll(() => new URL(page.url()).search).not.toContain("id=");
    });

    test("keeps the list's scroll position through a round trip", async ({
      page,
    }) => {
      const scroller = page.locator(".bx--splitter__pane--start");
      await scroller.evaluate((el) => {
        el.scrollTop = 600;
      });
      await ticket(page, 20).click();
      await expect(detail(page)).toBeVisible();

      await back(page).click();

      await expect(list(page)).toBeVisible();
      await expect
        .poll(() => scroller.evaluate((el) => el.scrollTop))
        .toBeGreaterThan(400);
    });

    test("shows the loading state and focuses the pane until it ends", async ({
      page,
    }) => {
      await open(page, "?width=500px&loading");
      await ticket(page, 2).click();

      await expect(page.locator(".bx--list-detail__body")).toHaveAttribute(
        "aria-busy",
        "true",
      );
      await expect(page.locator(".bx--skeleton__text").first()).toBeVisible();
      await expect(page.locator(".bx--list-detail__body")).toBeFocused();
    });

    test("opens a deep link on the details, and Back stays on the page", async ({
      page,
    }) => {
      await open(page, "?width=500px&id=7");

      await expect(detail(page)).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Ticket 7: Dark theme contrast" }),
      ).toBeVisible();

      await back(page).click();
      await expect(list(page)).toBeVisible();
      await expect(ticket(page, 7)).toBeFocused();
      expect(new URL(page.url()).pathname).toBe("/host.html");
    });
  });

  test("keeps the selection and the focus across the breakpoint", async ({
    page,
  }) => {
    await open(page, "?width=900px");
    await ticket(page, 5).click();
    await expect(ticket(page, 5)).toBeFocused();

    await widthOf(page, 500);
    await expect(list(page)).toBeHidden();
    await expect(detail(page)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ticket 5: Login fails" }),
    ).toBeFocused();

    await widthOf(page, 900);
    await expect(list(page)).toBeVisible();
    await expect(detail(page)).toBeVisible();
    await expect(ticket(page, 5)).toHaveAttribute("aria-current", "true");
    await expect(
      page.getByRole("heading", { name: "Ticket 5: Login fails" }),
    ).toBeVisible();

    // Back at one pane with the list showing, nothing selected moves focus.
    await widthOf(page, 500);
    await back(page).click();
    await expect(ticket(page, 5)).toBeFocused();
    await widthOf(page, 900);
    await expect(ticket(page, 5)).toBeFocused();
  });

  test("measures the window with responsiveTo viewport", async ({ page }) => {
    await open(page, "?width=500px&responsiveTo=viewport");
    // The frame is narrow, the window is 1280px wide: two panes.
    await expect(list(page)).toBeVisible();
    await expect(detail(page)).toBeVisible();

    await page.setViewportSize({ width: 600, height: 720 });
    await expect(detail(page)).toBeHidden();
  });

  test("honors the breakpoint prop", async ({ page }) => {
    await open(page, "?width=900px&breakpoint=lg");
    await expect(detail(page)).toBeHidden();
    await widthOf(page, 1100);
    await expect(detail(page)).toBeVisible();
  });

  test("a dialog in the details still fills the window", async ({ page }) => {
    // A container query does not make the layout a containing block for
    // fixed-position content, so an inline Modal needs no portal.
    await open(page, "?width=900px&modalInside&id=2");
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const box = await page.locator(".bx--modal").boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error("missing box");
    expect(box.width).toBe(viewport.width);
  });

  test.describe("keyboard", () => {
    test.beforeEach(async ({ page }) => {
      await open(page, "?width=900px");
    });

    test("one Tab stop in the list, arrows move, Enter opens", async ({
      page,
    }) => {
      await expect(
        page.locator("[data-list-detail-id][tabindex='0']"),
      ).toHaveCount(1);
      // Firefox and Safari on macOS skip links on Tab unless the system
      // setting is on, so start from the region and Tab into the list.
      await list(page).focus();
      await page.keyboard.press("Tab");
      await expect(ticket(page, 1)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(ticket(page, 3)).toBeFocused();
      await page.keyboard.press("End");
      await expect(ticket(page, 40)).toBeFocused();
      await page.keyboard.press("Home");
      await expect(ticket(page, 1)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(ticket(page, 2)).toHaveAttribute("aria-current", "true");
      await expect(
        page.getByRole("heading", { name: "Ticket 2: Export hangs" }),
      ).toBeVisible();

      // Tab leaves the list for the details in one press.
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "Open dialog" }),
      ).toBeFocused();
    });

    test("Shift+Tab from the details lands on the selected item", async ({
      page,
    }) => {
      await ticket(page, 6).click();
      await page.getByRole("button", { name: "Open dialog" }).focus();
      await page.keyboard.press("Shift+Tab");
      await expect(ticket(page, 6)).toBeFocused();
    });
  });

  test("lists on the right in RTL, with the Back arrow mirrored", async ({
    page,
  }) => {
    await open(page, "?width=900px&id=2");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const l = await list(page).boundingBox();
    const d = await detail(page).boundingBox();
    if (!l || !d) throw new Error("missing box");
    expect(l.x).toBeGreaterThan(d.x);

    await widthOf(page, 500);
    const transform = await back(page)
      .locator("svg")
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  test.describe("resizable", () => {
    test("drags the divider and hides it with one pane", async ({ page }) => {
      await open(page, "?width=900px&resizable");
      const separator = page.getByRole("separator", { name: "Resize list" });
      const before = await list(page).boundingBox();
      await separator.focus();
      await page.keyboard.press("Shift+ArrowRight");
      const after = await list(page).boundingBox();
      if (!before || !after) throw new Error("missing box");
      expect(after.width).toBeGreaterThan(before.width + 50);

      await widthOf(page, 500);
      await expect(separator).toBeHidden();
      await expect(list(page)).toBeVisible();
    });
  });

  test.describe("history", () => {
    test("browser Back and Forward walk between the list and the details", async ({
      context,
    }) => {
      // A fresh page, not the host: this one navigates for real.
      const page = await context.newPage();
      await page.goto("/index.html");
      await page.goto("/list-detail-layout.html?width=500px");
      await expect(list(page)).toBeVisible();

      await ticket(page, 4).click();
      await expect(detail(page)).toBeVisible();
      expect(new URL(page.url()).searchParams.get("id")).toBe("4");

      await page.goBack();
      await expect(list(page)).toBeVisible();
      await expect(detail(page)).toBeHidden();
      await expect(ticket(page, 4)).toBeFocused();

      await page.goForward();
      await expect(detail(page)).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Ticket 4: Slow search" }),
      ).toBeFocused();

      // The Back button is the browser's Back: no extra entries.
      await back(page).click();
      await expect(list(page)).toBeVisible();
      await page.goBack();
      await expect(page).toHaveURL(/index\.html/);
      await page.close();
    });

    test("restores a shared link after a reload", async ({ context }) => {
      const page = await context.newPage();
      await page.goto("/list-detail-layout.html?width=900px");
      await ticket(page, 9).click();
      await page.reload();

      await expect(ticket(page, 9)).toHaveAttribute("aria-current", "true");
      await expect(
        page.getByRole("heading", { name: "Ticket 9: Login fails" }),
      ).toBeVisible();
      await page.close();
    });
  });

  test.describe("without script", () => {
    // The server renders both panes; the CSS alone picks what shows. Take
    // the mounted markup, load it with script off, and compare.
    for (const [width, panes] of [
      [900, "two"],
      [500, "one"],
    ] as const) {
      test(`lays out ${panes} pane at ${width}px`, async ({
        page,
        browser,
      }) => {
        await open(page, `?width=${width}px`);
        const html = await page.locator("#app").innerHTML();
        const css = await page.evaluate(() =>
          [...document.styleSheets]
            .flatMap((sheet) => [...sheet.cssRules])
            .map((rule) => rule.cssText)
            .join("\n"),
        );
        const mounted = await Promise.all(
          [list(page), detail(page)].map((locator) => locator.boundingBox()),
        );

        const bare = await browser.newContext({
          javaScriptEnabled: false,
          viewport: page.viewportSize(),
        });
        const plain = await bare.newPage();
        await plain.setContent(
          `<style>${css}</style><div id="app">${html}</div>`,
        );
        const server = await Promise.all(
          [list(plain), detail(plain)].map((locator) => locator.boundingBox()),
        );
        await bare.close();

        expect(server.map((box) => box && Math.round(box.width))).toEqual(
          mounted.map((box) => box && Math.round(box.width)),
        );
      });
    }
  });

  // The layout sweep runs the empty state at 1280, 672 and 320; this adds
  // the Carbon widths in between, with an item selected.
  for (const width of [320, 672, 1056, 1584]) {
    for (const id of ["", "2"]) {
      test(`fits at ${width}px${id ? " with a selection" : ""}`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "the checks are Chromium's");
        await page.setViewportSize({ width, height: 720 });
        await open(page, id ? `?id=${id}` : "");
        await expect(page.locator(".bx--list-detail")).toBeVisible();
        for (const check of ["overflow", "borders", "fits"] as const) {
          expect(await findLayoutProblems(page, check)).toEqual([]);
        }
      });
    }
  }

  test.describe("axe", () => {
    const scan = async (page: Page) => {
      const results = await new AxeBuilder({ page })
        .include('[data-testid="frame"]')
        .analyze();
      expect(results.violations).toEqual([]);
    };

    test("two panes, empty and selected", async ({ page }) => {
      await open(page, "?width=900px");
      await scan(page);
      await ticket(page, 3).click();
      await scan(page);
    });

    test("one pane, list and details", async ({ page }) => {
      await open(page, "?width=500px");
      await scan(page);
      await ticket(page, 3).click();
      await scan(page);
    });

    test("Gray 100", async ({ page }) => {
      await open(page, "?width=900px&id=3");
      // The selected item fades its fill; axe would read it mid-fade.
      await page.addStyleTag({ content: "* { transition: none !important; }" });
      await page.evaluate(() => {
        document.documentElement.setAttribute("theme", "g100");
      });
      await scan(page);
    });

    test("RTL", async ({ page }) => {
      await open(page, "?width=900px&id=3");
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      await scan(page);
    });

    test("loading", async ({ page }) => {
      await open(page, "?width=900px&id=3&loading");
      await scan(page);
    });
  });
});

test.describe("ListDetailLayout forced colors", () => {
  test("draws the divider and marks the selected item", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "?width=900px&id=2");

    const read = () =>
      page.evaluate(() => {
        const resolve = (name: string) => {
          const probe = document.createElement("div");
          probe.style.backgroundColor = name;
          document.body.append(probe);
          const color = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return color;
        };
        const divider = document.querySelector(".bx--splitter__separator");
        const item = document.querySelector(
          "[data-list-detail-id='2'].bx--contained-list-item__content",
        );
        if (!divider || !item) throw new Error("missing element");
        return {
          divider: getComputedStyle(divider, "::after").backgroundColor,
          item: getComputedStyle(item).backgroundColor,
          text: resolve("CanvasText"),
          highlight: resolve("Highlight"),
        };
      });

    // The item fades its fill in.
    await expect
      .poll(async () => (await read()).item)
      .toBe((await read()).highlight);
    const colors = await read();
    expect(colors.divider).toBe(colors.text);
  });
});
