import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const bar = (page: Page) => page.getByRole("toolbar", { name: "Formatting" });
const more = (page: Page) => bar(page).getByRole("button", { name: "More" });
const names = (page: Page) =>
  bar(page)
    .locator(".bx--action-bar__button")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.checkVisibility())
        .map(
          (node) =>
            node.querySelector(".bx--assistive-text")?.firstChild
              ?.textContent ?? node.textContent?.trim(),
        ),
    );

/** Resize the first bar and wait for the layout to settle. */
async function resize(page: Page, width: number) {
  await page.locator("#basic").evaluate((node, value) => {
    node.style.width = `${value}px`;
  }, width);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

test.describe("ActionBar", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/action-bar.html");
    await expect(bar(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has none with the menu open, narrow, in Gray 100", async ({ page }) => {
    await page.goto("/action-bar.html");
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await resize(page, 260);
    await more(page).click();
    await expect(page.getByRole("menu")).toBeVisible();
    // The menu is portalled out of #app, so the page's own rules are off.
    const results = await new AxeBuilder({ page })
      .disableRules(["region", "landmark-one-main", "page-has-heading-one"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("is one tab stop, and arrow keys move through it", async ({ page }) => {
    await page.goto("/action-bar.html");
    await expect(page.getByRole("button", { name: "Undo" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    await page.locator("body").press("Tab");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Redo" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("button", { name: "Save" })).toBeFocused();

    // Tab leaves the bar from any item.
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
  });

  test("toggles with Space and Enter, and chooses a radio with Space", async ({
    page,
  }) => {
    await page.goto("/action-bar.html");
    await page.getByRole("button", { name: "Bold" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.getByRole("radio", { name: "Align left" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("radio", { name: "Align center" }),
    ).toBeFocused();
    await expect(page.getByTestId("align")).toHaveText("left");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("align")).toHaveText("center");
    await expect(
      page.getByRole("radio", { name: "Align center" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("shows the tooltip with its shortcut", async ({ page }) => {
    await page.goto("/action-bar.html");
    await page.getByRole("button", { name: "Bold" }).hover();
    const tooltip = page
      .locator(".bx--tooltip--visible, .bx--assistive-text")
      .filter({ hasText: "Bold" });
    await expect(tooltip.first()).toBeVisible();
    await expect(tooltip.first()).toContainText(/Ctrl|⌘/);
  });

  test("collapses what does not fit into the menu, last first", async ({
    page,
  }) => {
    await page.goto("/action-bar.html");
    expect(await names(page)).toContain("Delete");
    await expect(more(page)).toHaveCount(0);

    await resize(page, 420);
    await expect(more(page)).toBeVisible();
    // Underline has the lowest priority, then the end of the row goes.
    expect(await names(page)).not.toContain("Underline");
    expect(await names(page)).toContain("Undo");
    // The pinned Save never goes.
    expect(await names(page)).toContain("Save");

    await resize(page, 640);
    await expect(more(page)).toHaveCount(0);
    expect(await names(page)).toContain("Underline");
  });

  test("expands at a larger width than it collapses at", async ({ page }) => {
    await page.goto("/action-bar.html");
    // Find the widest width at which the bar collapses.
    const boundary = await page.locator("#basic").evaluate(async (node) => {
      const frame = () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
      let width = 640;
      while (!node.querySelector(".bx--action-bar__more") && width > 100) {
        width -= 1;
        node.style.width = `${width}px`;
        // biome-ignore lint/performance/noAwaitInLoops: one width at a time
        await frame();
      }
      return width;
    });
    // Back and forth across the boundary, it stays collapsed.
    for (const width of [boundary + 1, boundary, boundary + 8]) {
      // biome-ignore lint/performance/noAwaitInLoops: one width at a time
      await resize(page, width);
      await expect(more(page)).toBeVisible();
    }
    await resize(page, boundary + 17);
    await expect(more(page)).toHaveCount(0);
  });

  test("runs a collapsed button from the menu, and returns focus", async ({
    page,
  }) => {
    await page.goto("/action-bar.html");
    await resize(page, 300);
    const trigger = more(page);
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page
      .getByRole("menuitem", { name: "Copy" })
      .or(page.getByRole("menuitemcheckbox", { name: "Italic" }))
      .first()
      .click();
    await expect(page.getByTestId("clicks")).not.toHaveText("");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("closes the menu opened by the pointer with Escape", async ({
    page,
  }) => {
    await page.goto("/action-bar.html");
    await resize(page, 300);
    await more(page).click();
    await expect(page.getByRole("menu")).toBeVisible();
    // The trigger's tooltip is open from the hover; it must not take the key.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(more(page)).toBeFocused();
  });

  test("moves focus to the trigger when the focused button collapses", async ({
    page,
  }) => {
    await page.goto("/action-bar.html");
    await page.getByRole("button", { name: "Copy" }).focus();
    await resize(page, 300);
    await expect(more(page)).toBeFocused();
    await expect(more(page)).toHaveAttribute("tabindex", "0");
  });

  test("keeps a collapsed button's shortcut", async ({ page }) => {
    await page.goto("/action-bar.html");
    await resize(page, 200);
    await expect(more(page)).toBeVisible();
    expect(await names(page)).not.toContain("Bold");
    const apple = await page.evaluate(() =>
      /mac|iphone|ipad/i.test(
        (navigator as { userAgentData?: { platform?: string } }).userAgentData
          ?.platform ||
          navigator.platform ||
          navigator.userAgent,
      ),
    );
    await page.keyboard.press(apple ? "Meta+b" : "Control+b");
    await expect(page.getByTestId("clicks")).toHaveText("bold");
  });

  test("swaps Left and Right, and mirrors, under dir=rtl", async ({ page }) => {
    await page.goto("/action-bar.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await resize(page, 300);
    const trigger = more(page);
    const toolbar = bar(page);
    const box = await toolbar.boundingBox();
    const moreBox = await trigger.boundingBox();
    // The trigger sits at the inline end, which is the left in RTL.
    if (!box || !moreBox) throw new Error("the bar has no box");
    expect(moreBox.x - box.x).toBeLessThan(2);

    await page.getByRole("button", { name: "Undo" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("button", { name: "Redo" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
  });

  test("shows a pressed button without color in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/action-bar.html");
    const pressed = page.getByRole("radio", { name: "Align left" });
    const plain = page.getByRole("radio", { name: "Align center" });
    const paint = (node: ReturnType<Page["locator"]>) =>
      node.evaluate((el) => {
        const style = getComputedStyle(el);
        return `${style.backgroundColor}|${style.color}`;
      });
    expect(await paint(pressed)).not.toBe(await paint(plain));
  });

  test("draws one ring, on the focused button, in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/action-bar.html");
    await page.getByRole("button", { name: "Italic" }).focus();
    const edges = await bar(page)
      .locator(".bx--action-bar__button")
      .evaluateAll((nodes) => {
        const probe = document.createElement("span");
        probe.style.color = "Canvas";
        document.body.append(probe);
        const canvas = getComputedStyle(probe).color;
        probe.remove();
        return nodes
          .filter((node) => node.checkVisibility())
          .map((node) => {
            const style = getComputedStyle(node);
            const box =
              style.borderTopColor !== canvas &&
              style.borderTopColor !== "rgba(0, 0, 0, 0)";
            const ring =
              style.outlineStyle !== "none" &&
              Number.parseFloat(style.outlineWidth) >= 2;
            return { focused: node === document.activeElement, box, ring };
          });
      });
    // A border that shows would be a box around every button.
    expect(edges.filter((edge) => edge.box && !edge.focused)).toEqual([]);
    expect(edges.filter((edge) => edge.ring)).toEqual([
      { focused: true, box: false, ring: true },
    ]);
  });

  test("keeps the keys of a nested field and dropdown", async ({ page }) => {
    await page.goto("/action-bar-fields.html");
    await page.getByRole("button", { name: "Add row" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("searchbox", { name: "Find" })).toBeFocused();
    await page.keyboard.type("abc");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("searchbox", { name: "Find" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("searchbox", { name: "Find" })).toBeFocused();
    // At the start of the text, Left leaves the field.
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("combobox")).toBeFocused();
    // The bar is one tab stop, so Tab skips the buttons on either side.
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
    // And Shift+Tab comes back to the item that was last in focus.
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("combobox")).toBeFocused();
  });

  test("keeps a field's hidden label inside the bar at 320 px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto("/action-bar-fields.html");
    await page.locator("#fields").evaluate((node) => {
      node.style.width = "320px";
    });
    await expect(page.getByRole("toolbar")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("a vertical bar moves with Up and Down and collapses to its height", async ({
    page,
  }) => {
    await page.goto("/action-bar-vertical.html");
    const tools = page.getByRole("toolbar", { name: "Tools", exact: true });
    await expect(tools).toHaveAttribute("aria-orientation", "vertical");
    // A column is as wide as its buttons, not as wide as the page.
    expect((await tools.boundingBox())?.width).toBeLessThanOrEqual(48);
    await expect(tools.getByRole("button", { name: "More" })).toBeVisible();
    await tools.getByRole("button", { name: "Add" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tools.getByRole("button", { name: "Add" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(tools.getByRole("button", { name: "Copy" })).toBeFocused();
  });

  test("accounts for every button of forty as the bar resizes", async ({
    page,
  }) => {
    await page.goto("/action-bar-many.html");
    const many = page.getByRole("toolbar", { name: "Many tools" });
    for (const width of [1400, 700, 300, 700, 1400]) {
      // biome-ignore lint/performance/noAwaitInLoops: one width at a time
      await page.locator("#many").evaluate((node, value) => {
        node.style.width = `${value}px`;
      }, width);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const shown = await many
        .locator(".bx--action-bar__button")
        .evaluateAll(
          (nodes) => nodes.filter((node) => node.checkVisibility()).length,
        );
      const trigger = many.getByRole("button", { name: "More" });
      if (shown === 40) {
        await expect(trigger).toHaveCount(0);
        continue;
      }
      await trigger.click();
      await expect(
        page.locator('[role="menu"] [role^="menuitem"]'),
      ).toHaveCount(40 - shown);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
    }
  });

  test("forces about one layout per frame while forty buttons resize", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "reads Chromium's layout counters");
    await page.goto("/action-bar-many.html");
    await expect(page.getByRole("toolbar")).toBeVisible();
    const session = await page.context().newCDPSession(page);
    await session.send("Performance.enable");
    const layouts = async () => {
      const { metrics } = await session.send("Performance.getMetrics");
      return (
        metrics.find((metric) => metric.name === "LayoutCount")?.value ?? 0
      );
    };
    const frames = 120;
    const before = await layouts();
    await page.evaluate(
      (count) =>
        new Promise<void>((resolve) => {
          const node = document.querySelector<HTMLElement>("#many");
          let frame = 0;
          const step = () => {
            if (node) node.style.width = `${1400 - frame * 9}px`;
            frame += 1;
            if (frame < count) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
      frames,
    );
    // Writing the width is one layout a frame, and a collapse the observer
    // causes in the same frame is a second. Reading a size per button would
    // add forty a frame.
    expect(((await layouts()) - before) / frames).toBeLessThan(2.5);
  });
});
