import { expect, test } from "./helpers/host";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByTestId("search-query")).toBeVisible();
    await expect(
      page.getByText("Search", { exact: true }).first(),
    ).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const search = page.getByTestId("search-query");
    await expect(search).toBeVisible();
    await search.fill("test query");
    await expect(search).toHaveValue("test query");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const search = page.getByTestId("search-query");
    await expect(search).toBeVisible();
    await search.fill("carbon");
    await expect(search).toHaveValue("carbon");
  });

  test("clear button clears input", async ({ page }) => {
    const search = page.getByTestId("search-query");
    await search.fill("something");
    await expect(search).toHaveValue("something");
    const firstSearch = page.locator(".bx--search").filter({
      has: page.getByTestId("search-query"),
    });
    await firstSearch
      .getByRole("button", { name: "Clear search input" })
      .click();
    await expect(search).toHaveValue("");
  });

  test("expandable search expands when magnifier is clicked", async ({
    page,
  }) => {
    const wrapper = page.locator(".bx--search--expandable");
    await expect(wrapper).not.toHaveClass(/bx--search--expanded/);
    await wrapper.locator(".bx--search-magnifier").click();
    await expect(wrapper).toHaveClass(/bx--search--expanded/);
  });

  test("expandable search expands on input focus", async ({ page }) => {
    const wrapper = page.locator(".bx--search--expandable");
    await wrapper.locator(".bx--search-magnifier").click();
    const input = wrapper.getByRole("searchbox");
    await input.focus();
    await expect(wrapper).toHaveClass(/bx--search--expanded/);
  });

  test("expandable search collapses on Escape then blur when empty", async ({
    page,
  }) => {
    const wrapper = page.locator(".bx--search--expandable");
    await wrapper.locator(".bx--search-magnifier").click();
    const searchbox = wrapper.getByRole("searchbox");
    await searchbox.focus();
    await page.keyboard.press("Escape");
    // Blur by focusing the other search field so behavior does not depend on
    // Tab order (differs across browsers with in-component controls).
    await page.getByTestId("search-query").click();
    await expect(wrapper).not.toHaveClass(/bx--search--expanded/);
  });

  test("defaults to the 40px md height, as in v11", async ({ page }) => {
    await expect(page.getByTestId("search-query")).toHaveCSS("height", "40px");
  });
});

// With focus in the field, a hovered clear button drew its own focus ring
// inside the field's. On Search its start-edge strip hid the inner edge;
// ToolbarSearch hides that strip, so the edge showed.
test("a hovered clear button adds no ring to the focused field", async ({
  page,
}) => {
  const cases = [
    {
      component: "Search",
      open: () => page.goto("/search.html"),
      scope: ".bx--search:has([data-testid=search-query])",
    },
    {
      component: "ToolbarSearch",
      open: () => page.goto("/data-table-variants.html"),
      scope: "[data-testid=toolbar] .bx--toolbar-search-container-persistent",
    },
  ];
  for (const { component, open, scope } of cases) {
    // biome-ignore lint/performance/noAwaitInLoops: one page at a time
    await open();
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await page.locator(`${scope} input`).fill("us-east");
    await page.hover(`${scope} .bx--search-close`);
    for (const theme of ["white", "g100"]) {
      const name = `${component} ${theme}`;
      // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
      const read = await page.evaluate(
        ([scope, theme]) => {
          document.documentElement.setAttribute("theme", theme);
          const root = document.querySelector(scope);
          const close = root?.querySelector(".bx--search-close");
          if (!root || !close) throw new Error(`no ${scope}`);
          const rings = [root, ...root.querySelectorAll("*")].filter((el) => {
            const style = getComputedStyle(el);
            return (
              style.outlineStyle !== "none" &&
              Number.parseFloat(style.outlineWidth) > 0 &&
              !/rgba\(.*, 0\)$/.test(style.outlineColor)
            );
          });
          const { x, y, width, height } = close.getBoundingClientRect();
          const probe = document.createElement("span");
          probe.style.color = "var(--cds-focus)";
          document.body.append(probe);
          const focus = getComputedStyle(probe).color;
          probe.remove();
          return {
            rings: rings.map((el) => el.className || el.tagName),
            // Inside the field's 2px ring: the button minus its top, bottom
            // and inline-end edges.
            clip: { x, y: y + 2, width: width - 2, height: height - 4 },
            focus,
          };
        },
        [scope, theme] as const,
      );
      expect.soft(read.rings, `${name} rings`).toEqual(["bx--search-input"]);
      const png = await page.screenshot({ clip: read.clip });
      const focusPixels = await page.evaluate(
        async ([png, focus]) => {
          const img = new Image();
          img.src = `data:image/png;base64,${png}`;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no 2d context");
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, img.width, img.height);
          const rgb = (focus.match(/\d+/g) ?? []).slice(0, 3).map(Number);
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (rgb.every((c, k) => Math.abs((data[i + k] ?? 0) - c) <= 2)) {
              count++;
            }
          }
          return count;
        },
        [png.toString("base64"), read.focus] as const,
      );
      expect.soft(focusPixels, `${name} focus pixels inside`).toBe(0);
    }
  }
});
