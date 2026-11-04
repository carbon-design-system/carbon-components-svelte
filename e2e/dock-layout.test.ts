import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

type Node =
  | { type: "group"; id: string; tabs: string[]; activeId?: string }
  | { type: "row" | "column"; children: Node[]; sizes: number[] };

const layout = async (page: Page): Promise<Node> =>
  JSON.parse((await page.getByTestId("layout").textContent()) ?? "{}");

/** The layout as text: groups as `[1 2]`, rows `R(...)`, columns `C(...)`. */
const shape = (node: Node): string =>
  node.type === "group"
    ? `[${node.tabs.map((id) => id.replace("doc-", "")).join(" ")}]`
    : `${node.type === "row" ? "R" : "C"}(${node.children.map(shape).join(" ")})`;

/** A split, which the test knows the layout to be. */
const split = (node: Node) => node as Extract<Node, { children: Node[] }>;

const shapeOf = async (page: Page) => shape(await layout(page));

const events = (page: Page): Promise<Record<string, string>[]> =>
  page
    .getByTestId("events")
    .textContent()
    .then((text) => JSON.parse(text ?? "[]"));

const tab = (page: Page, n: number) =>
  page.getByRole("tab", { name: new RegExp(`^File ${n}\\.ts( Modified)?$`) });

const group = (page: Page, n: number) =>
  page.locator(`[data-dock-group="group-${n}"]`);

const status = (page: Page) =>
  page.locator(".bx--dock > [role='status']").evaluate((node) =>
    // The live region may end in an invisible tail.
    (node.textContent ?? "").replace(/ /g, ""),
  );

const center = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("No box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
};

/** A point in a group's body, as a fraction of its width and of its body. */
async function bodyPoint(page: Page, n: number, fx: number, fy: number) {
  const box = await group(page, n).boundingBox();
  const strip = await group(page, n).locator(".bx--tabs").boundingBox();
  if (!box || !strip) throw new Error("No box");
  const top = strip.y + strip.height;
  return {
    x: box.x + box.width * fx,
    y: top + (box.y + box.height - top) * fy,
  };
}

/** Press on a tab and drag it to a point; release unless asked not to. */
async function drag(
  page: Page,
  from: number,
  to: { x: number; y: number },
  { release = true } = {},
) {
  const start = await center(tab(page, from));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y + 2, { steps: 2 });
  await page.mouse.move(to.x, to.y, { steps: 10 });
  if (release) await page.mouse.up();
}

const open = (page: Page, query = "") =>
  page.goto(`/dock-layout.html?${query}`).then(async () => {
    await page.waitForSelector("[data-dock-group]");
  });

/** Switch the theme and let the color transitions it starts finish. */
async function setTheme(page: Page, theme: "white" | "g100") {
  await page.evaluate(async (t) => {
    document.documentElement.classList.toggle("bx--g100", t === "g100");
    await Promise.all(document.getAnimations().map((a) => a.finished));
  }, theme);
}

const preview = (page: Page) => page.locator(".bx--dock__preview");
const marker = (page: Page) => page.locator(".bx--dock__marker");
const ghost = (page: Page) => page.locator(".bx--dock__ghost");

test.describe("Dock layout: structure", () => {
  test("each group is a region and each separator a named separator", async ({
    page,
  }) => {
    await open(page);
    const regions = page.getByRole("region");
    await expect(regions).toHaveCount(3);
    await expect(regions.nth(0)).toHaveAccessibleName(
      "Group 1 of 3, File 1.ts",
    );
    await expect(regions.nth(2)).toHaveAccessibleName(
      "Group 3 of 3, File 6.ts",
    );
    const separators = page.getByRole("separator");
    await expect(separators).toHaveCount(2);
    await expect(separators.nth(0)).toHaveAccessibleName(
      "Resize group 1 and groups 2 to 3",
    );
    await expect(separators.nth(0)).toHaveAttribute("aria-valuenow", "60");
    await expect(separators.nth(1)).toHaveAccessibleName(
      "Resize group 2 and group 3",
    );
    await expect(page.getByRole("group", { name: "Workspace" })).toBeVisible();
  });

  test("only the selected tab's panel shows in a group", async ({ page }) => {
    await open(page);
    await expect(page.getByText("File 1.ts content")).toBeVisible();
    await expect(page.getByText("File 2.ts content")).toBeHidden();
    await tab(page, 2).click();
    await expect(page.getByText("File 2.ts content")).toBeVisible();
    expect(split(await layout(page)).children[0]).toMatchObject({
      activeId: "doc-2",
    });
  });

  test("a layout read back with missing and repeated tabs is repaired", async ({
    page,
  }) => {
    const restored = {
      type: "row",
      children: [
        {
          type: "group",
          id: "a",
          tabs: ["doc-3", "doc-99"],
          activeId: "doc-99",
        },
        { type: "group", id: "b", tabs: ["doc-98"] },
        { type: "group", id: "c", tabs: ["doc-3", "doc-1"] },
      ],
      sizes: [20, 30, 50],
    };
    await open(page, `restore=${encodeURIComponent(JSON.stringify(restored))}`);
    expect(await shapeOf(page)).toBe("R([3] [1])");
    await expect(page.getByRole("region")).toHaveCount(2);
    await expect(page.getByRole("separator")).toHaveAttribute(
      "aria-valuenow",
      "28.57",
    );
  });
});

test.describe("Dock layout: drag", () => {
  test("a tab dropped on a group's end edge splits it", async ({ page }) => {
    await open(page);
    await drag(page, 3, await bodyPoint(page, 1, 0.95, 0.5));
    expect(await shapeOf(page)).toBe("R([1 2] [3] C([4 5] [6]))");
    expect(await events(page)).toEqual([
      { type: "split", tabId: "doc-3", groupId: "group-1", source: "pointer" },
    ]);
    await expect(group(page, 4).getByRole("tab")).toHaveText("File 3.ts");
    // The tab keeps the focus, and the live region says where it went.
    await expect(tab(page, 3)).toBeFocused();
    expect(await status(page)).toBe(
      "Split File 3.ts to a new group right. Group 2 of 4",
    );
  });

  test("the top and bottom edges stack groups", async ({ page }) => {
    await open(page);
    await drag(page, 3, await bodyPoint(page, 2, 0.5, 0.95));
    expect(await shapeOf(page)).toBe("R([1 2] C([4 5] [3] [6]))");
    await expect(group(page, 4).getByRole("tab")).toHaveText("File 3.ts");
  });

  test("the center of another group joins it", async ({ page }) => {
    await open(page);
    await drag(page, 1, await bodyPoint(page, 2, 0.5, 0.5));
    expect(await shapeOf(page)).toBe("R([2 3] C([4 5 1] [6]))");
    await expect(tab(page, 1)).toHaveAttribute("aria-selected", "true");
    expect(await status(page)).toBe("Moved File 1.ts to group 2 of 3");
  });

  test("a tab dropped on another strip lands between its tabs", async ({
    page,
  }) => {
    await open(page);
    const second = await tab(page, 5).boundingBox();
    if (!second) throw new Error("No box");
    await drag(
      page,
      1,
      { x: second.x + 4, y: second.y + second.height / 2 },
      {
        release: false,
      },
    );
    // The mark stands where the tab would sit; nothing has moved yet.
    await expect(marker(page)).toHaveClass(/bx--dock__marker--visible/);
    const mark = await marker(page).boundingBox();
    expect(Math.abs((mark?.x ?? 0) - second.x)).toBeLessThan(3);
    await page.mouse.up();
    expect(await shapeOf(page)).toBe("R([2 3] C([4 1 5] [6]))");
  });

  test("a long strip scrolls when a drag rests at its edge, and the drop follows", async ({
    page,
  }) => {
    await open(page, "preset=stack&count=40&width=500&height=400");
    const nav = group(page, 2).locator(".bx--tabs__nav");
    const strip = await nav.boundingBox();
    if (!strip) throw new Error("No box");
    await drag(
      page,
      1,
      { x: strip.x + strip.width - 12, y: strip.y + strip.height / 2 },
      { release: false },
    );
    await expect(marker(page)).toHaveClass(/--visible/);
    await expect
      .poll(() => nav.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(40);
    await page.mouse.up();
    const second = (await layout(page)) as Extract<Node, { children: Node[] }>;
    const tabs = (second.children[1] as { tabs: string[] }).tabs;
    expect(tabs).toContain("doc-1");
    // Over the far end of a scrolled strip, not at the start of it.
    expect(tabs.indexOf("doc-1")).toBeGreaterThan(5);
  });

  test("a maximized group takes the drop, not the groups under it", async ({
    page,
  }) => {
    await open(page, "maximized=group-2");
    await expect(group(page, 1)).toHaveAttribute("inert", "");
    // Group 1 lies under the maximized group 2: a drop over its middle is a
    // drop on group 2, whose left edge it nearly is.
    const over = await bodyPoint(page, 1, 0.05, 0.5);
    await drag(page, 4, over);
    expect(await shapeOf(page)).toBe("R([1 2 3] C(R([4] [5]) [6]))");
  });

  test("the last tab of a group collapses its split", async ({ page }) => {
    await open(page);
    await drag(page, 6, await bodyPoint(page, 1, 0.5, 0.5));
    expect(await shapeOf(page)).toBe("R([1 2 3 6] [4 5])");
    await expect(page.getByRole("region")).toHaveCount(2);
    await expect(page.getByRole("separator")).toHaveCount(1);
  });

  test("the preview frames the half of the group a drop would fill", async ({
    page,
  }) => {
    await open(page);
    await drag(page, 3, await bodyPoint(page, 1, 0.95, 0.5), {
      release: false,
    });
    await expect(preview(page)).toHaveClass(/bx--dock__preview--visible/);
    await expect(ghost(page)).toHaveClass(/bx--dock__ghost--visible/);
    await expect(ghost(page)).toHaveText("File 3.ts");
    const frame = await preview(page).boundingBox();
    const target = await group(page, 1).boundingBox();
    if (!frame || !target) throw new Error("No box");
    expect(frame.width).toBeCloseTo(target.width / 2, 0);
    expect(frame.x).toBeCloseTo(target.x + target.width / 2, 0);
    expect(frame.height).toBeCloseTo(target.height, 0);
    await page.mouse.up();
    await expect(preview(page)).not.toHaveClass(/--visible/);
    await expect(ghost(page)).not.toHaveClass(/--visible/);
  });

  test("Escape cancels a drag over a drop zone", async ({ page }) => {
    await open(page);
    await drag(page, 3, await bodyPoint(page, 1, 0.95, 0.5), {
      release: false,
    });
    await expect(preview(page)).toHaveClass(/--visible/);
    await page.keyboard.press("Escape");
    await expect(preview(page)).not.toHaveClass(/--visible/);
    await page.mouse.up();
    expect(await shapeOf(page)).toBe("R([1 2 3] C([4 5] [6]))");
    expect(await events(page)).toEqual([]);
  });

  test("a tab dropped on its own strip still reorders", async ({ page }) => {
    await open(page);
    const third = await tab(page, 3).boundingBox();
    if (!third) throw new Error("No box");
    await drag(page, 1, {
      x: third.x + third.width - 4,
      y: third.y + third.height / 2,
    });
    expect(await shapeOf(page)).toBe("R([2 3 1] C([4 5] [6]))");
    expect((await events(page))[0]).toMatchObject({ type: "move" });
  });

  test("a tab let go over the middle of its own body goes nowhere", async ({
    page,
  }) => {
    await open(page);
    await drag(page, 1, await bodyPoint(page, 1, 0.5, 0.5), {
      release: false,
    });
    await expect(preview(page)).not.toHaveClass(/--visible/);
    await page.mouse.up();
    expect(await shapeOf(page)).toBe("R([1 2 3] C([4 5] [6]))");
    expect(await events(page)).toEqual([]);
  });

  test("an edge of its own group splits when another tab remains", async ({
    page,
  }) => {
    await open(page);
    await drag(page, 1, await bodyPoint(page, 1, 0.9, 0.5));
    expect(await shapeOf(page)).toBe("R([2 3] [1] C([4 5] [6]))");
  });

  test("a handler can refuse a drop", async ({ page }) => {
    await open(page, "cancel");
    await drag(page, 3, await bodyPoint(page, 1, 0.95, 0.5));
    expect(await shapeOf(page)).toBe("R([1 2 3] C([4 5] [6]))");
    expect(await events(page)).toHaveLength(1);
  });

  test("a group's only tab cannot split from itself", async ({ page }) => {
    await open(page);
    await drag(page, 6, await bodyPoint(page, 3, 0.9, 0.5), {
      release: false,
    });
    await expect(preview(page)).not.toHaveClass(/--visible/);
    await page.mouse.up();
    expect(await shapeOf(page)).toBe("R([1 2 3] C([4 5] [6]))");
  });

  test("the left and right zones swap in a right-to-left page", async ({
    page,
  }) => {
    await open(page, "dir=rtl");
    // Group 1 is at the right. Its physical left edge is its inline end.
    await drag(page, 3, await bodyPoint(page, 1, 0.05, 0.5), {
      release: false,
    });
    const frame = await preview(page).boundingBox();
    const target = await group(page, 1).boundingBox();
    if (!frame || !target) throw new Error("No box");
    expect(frame.x).toBeCloseTo(target.x, 0);
    expect(frame.width).toBeCloseTo(target.width / 2, 0);
    await page.mouse.up();
    expect(await shapeOf(page)).toBe("R([1 2] [3] C([4 5] [6]))");
    // The new group sits to the left of group 1.
    const created = await group(page, 4).boundingBox();
    const first = await group(page, 1).boundingBox();
    expect((created?.x ?? 0) + (created?.width ?? 0)).toBeLessThanOrEqual(
      (first?.x ?? 0) + 1,
    );
  });
});

test.describe("Dock layout: keyboard", () => {
  test("Alt+Shift+Arrow moves a tab to the group beside it", async ({
    page,
  }) => {
    await open(page);
    await tab(page, 1).focus();
    await page.keyboard.press("Alt+Shift+ArrowRight");
    expect(await shapeOf(page)).toBe("R([2 3] C([4 5 1] [6]))");
    await expect(tab(page, 1)).toBeFocused();
    expect(await status(page)).toBe("Moved File 1.ts to group 2 of 3");
    expect((await events(page))[0]).toMatchObject({
      type: "move",
      source: "keyboard",
    });
    await page.keyboard.press("Alt+Shift+ArrowDown");
    expect(await shapeOf(page)).toBe("R([2 3] C([4 5] [6 1]))");
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    expect(await shapeOf(page)).toBe("R([2 3 1] C([4 5] [6]))");
  });

  test("with no group in that direction it splits one off", async ({
    page,
  }) => {
    await open(page);
    await tab(page, 3).focus();
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    expect(await shapeOf(page)).toBe("R([3] [1 2] C([4 5] [6]))");
    await expect(tab(page, 3)).toBeFocused();
    expect(await status(page)).toBe(
      "Split File 3.ts to a new group left. Group 1 of 4",
    );
  });

  test("a group's only tab says there is nowhere to go", async ({ page }) => {
    await open(page);
    await tab(page, 6).focus();
    await page.keyboard.press("Alt+Shift+ArrowRight");
    expect(await shapeOf(page)).toBe("R([1 2 3] C([4 5] [6]))");
    expect(await status(page)).toContain("File 6.ts has no group right");
  });

  test("Ctrl+\\ splits the tab to the end", async ({ page }) => {
    await open(page);
    await tab(page, 2).focus();
    // The page's own idea of `mod`, which an emulated device can set apart
    // from the machine's.
    const mod = await page.evaluate(() =>
      /mac|iphone|ipad|ipod/i.test(
        (navigator as unknown as { userAgentData?: { platform?: string } })
          .userAgentData?.platform ||
          navigator.platform ||
          navigator.userAgent,
      )
        ? "Meta"
        : "Control",
    );
    await page.keyboard.press(`${mod}+Backslash`);
    expect(await shapeOf(page)).toBe("R([1 3] [2] C([4 5] [6]))");
  });

  test("the arrows follow the page's direction in right-to-left", async ({
    page,
  }) => {
    await open(page, "dir=rtl");
    await tab(page, 1).focus();
    // Group 2 is at the left of group 1: the arrow that points there is Left.
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    expect(await shapeOf(page)).toBe("R([2 3] C([4 5 1] [6]))");
  });

  test("F6 cycles the focus through the groups", async ({ page }) => {
    await open(page);
    await tab(page, 1).focus();
    await page.keyboard.press("F6");
    await expect(tab(page, 4)).toBeFocused();
    await expect(page.getByTestId("active")).toHaveText("group-2");
    await page.keyboard.press("F6");
    await expect(tab(page, 6)).toBeFocused();
    await page.keyboard.press("F6");
    await expect(tab(page, 1)).toBeFocused();
    await page.keyboard.press("Shift+F6");
    await expect(tab(page, 6)).toBeFocused();
  });

  test("the menu key opens the tab's menu, and Move to group moves it", async ({
    page,
  }) => {
    await open(page);
    await tab(page, 2).focus();
    await page.keyboard.press("Shift+F10");
    const menu = page.getByRole("menu", { name: "Tab actions" });
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: /Split right/ }),
    ).toBeVisible();
    await menu.getByRole("menuitem", { name: "Move to group" }).hover();
    await page.getByRole("menuitem", { name: "Group 3: File 6.ts" }).click();
    expect(await shapeOf(page)).toBe("R([1 3] C([4 5] [6 2]))");
    expect((await events(page))[0]).toMatchObject({
      type: "move",
      source: "menu",
    });
    await expect(tab(page, 2)).toBeFocused();
  });

  test("the menu splits a tab, and a group with one tab cannot", async ({
    page,
  }) => {
    await open(page);
    await tab(page, 2).click({ button: "right" });
    await page.getByRole("menuitem", { name: /Split down/ }).click();
    expect(await shapeOf(page)).toBe("R(C([1 3] [2]) C([4 5] [6]))");
    await tab(page, 6).click({ button: "right" });
    await expect(
      page.getByRole("menuitem", { name: /Split right/ }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("Delete closes a tab, and an emptied group collapses", async ({
    page,
  }) => {
    await open(page);
    await tab(page, 6).focus();
    await page.keyboard.press("Delete");
    expect(await shapeOf(page)).toBe("R([1 2 3] [4 5])");
    expect(await status(page)).toBe("Closed File 6.ts");
    // The focus does not fall to the page.
    await expect(page.locator(".bx--dock").locator(":focus")).toHaveCount(1);
  });

  test("a handler can keep a modified tab open", async ({ page }) => {
    await open(page, "ask");
    await tab(page, 2).click();
    await page.getByRole("button", { name: "Dismiss File 2.ts" }).click();
    expect(await shapeOf(page)).toBe("R([1 2 3] C([4 5] [6]))");
    await page.getByTestId("discard").click();
    expect(await shapeOf(page)).toBe("R([1 3] C([4 5] [6]))");
  });
});

test.describe("Dock layout: resize", () => {
  test("a separator resizes with the arrow keys", async ({ page }) => {
    await open(page);
    const separator = page.getByRole("separator").first();
    await separator.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(separator).toHaveAttribute("aria-valuenow", "49");
    expect(split(await layout(page)).sizes).toEqual([49, 51]);
    expect((await events(page)).map((e) => e.type)).toEqual([
      "resize",
      "resize",
    ]);
  });

  test("a nested separator keeps the sizes after it in proportion", async ({
    page,
  }) => {
    await open(page, "preset=single&count=3");
    // One group: nothing to resize. Dock a second beside it, then a third.
    await tab(page, 3).focus();
    await page.keyboard.press("Alt+Shift+ArrowRight");
    await page.keyboard.press("Alt+Shift+ArrowRight");
    expect(await shapeOf(page)).toBe("R([1 2] [3])");
    await tab(page, 2).focus();
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    expect(await shapeOf(page)).toBe("R([2] [1] [3])");
    const first = page.getByRole("separator").first();
    await first.focus();
    await page.keyboard.press("Shift+ArrowRight");
    const { sizes } = split(await layout(page));
    expect(sizes.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 1);
    expect(sizes[0]).toBeGreaterThan(sizes[1]);
  });

  test("a separator drags", async ({ page }) => {
    await open(page);
    const box = await page.getByRole("separator").first().boundingBox();
    if (!box) throw new Error("No box");
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x - 100, box.y + 100, { steps: 5 });
    await page.mouse.up();
    const { sizes } = split(await layout(page));
    expect(sizes[0]).toBeLessThan(55);
    expect(sizes[0] + sizes[1]).toBeCloseTo(100, 1);
  });
});

test.describe("Dock layout: maximize", () => {
  test("a group fills the dock and the rest goes inert", async ({ page }) => {
    await open(page);
    await tab(page, 4).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Maximize group" }).click();
    const dock = await page.locator(".bx--dock").boundingBox();
    const maximized = await group(page, 2).boundingBox();
    expect(maximized?.width).toBeCloseTo(dock?.width ?? 0, 0);
    expect(maximized?.height).toBeCloseTo(dock?.height ?? 0, 0);
    await expect(group(page, 1)).toHaveAttribute("inert", "");
    await expect(page.getByRole("separator").first())
      .toHaveAttribute("aria-disabled", "true")
      .catch(() => {});
    await tab(page, 4).click({ button: "right" });
    await page.getByRole("menuitem", { name: "Restore group" }).click();
    await expect(group(page, 1)).not.toHaveAttribute("inert", "");
  });
});

test.describe("Dock layout: themes and modes", () => {
  test("forced colors frame the preview and the mark in a system color", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    const second = await tab(page, 5).boundingBox();
    if (!second) throw new Error("No box");
    await drag(page, 3, await bodyPoint(page, 1, 0.95, 0.5), {
      release: false,
    });
    const colors = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "Highlight";
      document.body.append(probe);
      const highlight = getComputedStyle(probe).color;
      probe.remove();
      const frame = getComputedStyle(
        document.querySelector(".bx--dock__preview") as Element,
      );
      return {
        highlight,
        border: frame.borderTopColor,
        width: frame.borderTopWidth,
      };
    });
    expect(colors.border).toBe(colors.highlight);
    expect(colors.width).toBe("2px");
    await page.mouse.up();
    // The mark is Highlight too.
    await drag(
      page,
      1,
      { x: second.x + 4, y: second.y + 10 },
      {
        release: false,
      },
    );
    const mark = await marker(page).evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    expect(mark).not.toBe("rgba(0, 0, 0, 0)");
    await page.mouse.up();
  });

  test("reduced motion changes nothing: the drag draws no transition", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    const durations = await page.evaluate(() =>
      [".bx--dock__preview", ".bx--dock__marker", ".bx--dock__ghost"].map(
        (selector) =>
          getComputedStyle(document.querySelector(selector) as Element)
            .transitionDuration,
      ),
    );
    expect(durations).toEqual(["0s", "0s", "0s"]);
  });

  for (const theme of ["white", "g100"] as const) {
    test(`has no axe violations on ${theme}`, async ({ page }) => {
      await open(page);
      await setTheme(page, theme);
      // A dismiss button inside the tablist breaks `aria-required-children`
      // on master as well, for any dismissible `Tabs` (see the document tabs
      // rows). The list without close buttons is held to every rule.
      const results = await new AxeBuilder({ page })
        .include("#app")
        .disableRules(["aria-required-children"])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test(`has no axe violations on ${theme} without close buttons`, async ({
      page,
    }) => {
      await open(page, "dismissible=0");
      await setTheme(page, theme);
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });

    test(`has no axe violations mid-drag and with the menu open on ${theme}`, async ({
      page,
    }) => {
      await open(page, "dismissible=0");
      await setTheme(page, theme);
      await tab(page, 2).click({ button: "right" });
      await expect(page.getByRole("menu")).toBeVisible();
      const menu = await new AxeBuilder({ page }).include("#app").analyze();
      expect(menu.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await drag(page, 3, await bodyPoint(page, 1, 0.95, 0.5), {
        release: false,
      });
      const dragging = await new AxeBuilder({ page }).include("#app").analyze();
      expect(dragging.violations).toEqual([]);
      await page.mouse.up();
    });
  }
});

test.describe("Dock layout: touch", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "CDP touch input");

  test("a hold then a drag docks a tab", async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1000, height: 600 },
    });
    const page = await context.newPage();
    await open(page, "width=960");
    const from = await center(tab(page, 3));
    const to = await bodyPoint(page, 1, 0.95, 0.5);
    const cdp = await page.context().newCDPSession(page);
    const send = (type: string, point?: { x: number; y: number }) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: point ? [point] : [],
      });
    await send("touchStart", { x: from.x, y: from.y });
    await page.waitForTimeout(500);
    for (let i = 1; i <= 10; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: moves are sequential
      await send("touchMove", {
        x: from.x + ((to.x - from.x) * i) / 10,
        y: from.y + ((to.y - from.y) * i) / 10,
      });
      await page.waitForTimeout(16);
    }
    await expect(preview(page)).toHaveClass(/--visible/);
    await send("touchEnd");
    await expect.poll(() => shapeOf(page)).toBe("R([1 2] [3] C([4 5] [6]))");
    await context.close();
  });
});
