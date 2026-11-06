import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const cards = (page: Page) => page.locator(".ccs-catalog-card");
const count = (page: Page) => page.locator(".ccs-catalog__count");
const status = (page: Page) => page.locator(".ccs-catalog__status");
const search = (page: Page) =>
  page.getByRole("searchbox", { name: "Search the catalog" });
const results = (page: Page) => page.locator(".ccs-catalog__results");

async function open(page: Page, query = "") {
  await page.goto(`/catalog-page.html?${query}`);
  await expect(cards(page).first()).toBeVisible();
  await expect(results(page)).toHaveAttribute("aria-busy", "false");
}

/** Check a facet option by the start of its name. */
async function check(page: Page, name: RegExp) {
  await page.getByRole("checkbox", { name }).check({ force: true });
}

/** Scroll to the end until `n` items are loaded, as "Showing n of" says. */
async function loadItems(page: Page, n: number) {
  await expect
    .poll(
      async () => {
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        const text = await page.locator(".ccs-catalog__progress").textContent();
        return Number((text ?? "").replace(/ of.*$/, "").replace(/\D/g, ""));
      },
      { timeout: 60_000, intervals: [50] },
    )
    .toBeGreaterThanOrEqual(n);
}

/** Wait out the side panel's slide, so a click lands where the control is. */
async function settle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().length === 0);
}

/** The first card whose box is in the viewport, as its index and its top. */
function firstInView(page: Page) {
  return page.evaluate(() => {
    for (const cell of document.querySelectorAll<HTMLElement>("[data-index]")) {
      const { top, bottom } = cell.getBoundingClientRect();
      if (bottom > 80 && top < window.innerHeight) {
        return { index: Number(cell.dataset.index), top };
      }
    }
    return null;
  });
}

test.describe("CatalogPage", () => {
  test("search, facets, sort and view are one URL, and a reload and Back read it", async ({
    page,
  }) => {
    await open(page);
    await expect(count(page)).toHaveText("5,000 results");

    await check(page, /^Compute/);
    await expect(page).toHaveURL(/\?category=Compute$/);
    const compute = await count(page).textContent();
    expect(compute).not.toBe("5,000 results");

    await search(page).fill("vault");
    await expect(count(page)).toContainText("for “vault”");
    await expect(page).toHaveURL(/\?q=vault&category=Compute$/);

    await page.getByRole("combobox", { name: /Sort by/ }).click();
    await page.getByRole("option", { name: "Name (A to Z)" }).click();
    await expect(page).toHaveURL(/sort=name/);
    const titles = await page
      .locator(".ccs-catalog-card__link")
      .allTextContents();
    expect(titles).toEqual(
      [...titles].sort((a, b) => a.trim().localeCompare(b.trim())),
    );

    await page.getByRole("button", { name: "List view" }).click();
    await expect(page).toHaveURL(/view=list/);

    // A reload reads the same URL back into every control.
    const url = page.url();
    await page.reload();
    await expect(cards(page).first()).toBeVisible();
    expect(page.url()).toBe(url);
    await expect(search(page)).toHaveValue("vault");
    await expect(
      page.getByRole("checkbox", { name: /^Compute/ }),
    ).toBeChecked();
    await expect(
      page.getByRole("button", { name: "List view" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Back undoes the sort (the view only replaced the entry), then the facet.
    await page.goBack();
    await expect(page).toHaveURL(/\?q=vault&category=Compute$/);
    await page.goBack();
    await expect(page).toHaveURL(/\?category=Compute$/);
    await expect(count(page)).toHaveText(compute as string);
    await expect(search(page)).toHaveValue("");
    await page.goForward();
    await expect(search(page)).toHaveValue("vault");
  });

  test("a card is one link, and its buttons work without following it", async ({
    page,
  }) => {
    await open(page);
    const card = cards(page).first();
    const link = card.locator(".ccs-catalog-card__link");
    const favorite = card.getByRole("button", { name: /^Favorite / });
    expect(await card.getByRole("link").count()).toBe(1);

    // A press on the button, which the link's overlay would cover, is the button's.
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/catalog-page\.html\??$/);

    // A press on the empty part of the card follows the link.
    const box = (await card.boundingBox()) as NonNullable<
      Awaited<ReturnType<typeof card.boundingBox>>
    >;
    const href = await link.getAttribute("href");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 20);
    await expect(page).toHaveURL(new RegExp(`${href}$`.replace("/", "\\/")));
  });

  test("keyboard only: facets, then search, then each card's link and buttons", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit",
      "Safari does not tab to buttons and checkboxes by default",
    );
    await open(page);

    await page.getByRole("checkbox", { name: /^Compute/ }).focus();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/category=Compute/);
    // Focus stays on the option that was pressed.
    await expect(
      page.getByRole("checkbox", { name: /^Compute/ }),
    ).toBeFocused();

    // "/" jumps to the search, from anywhere.
    await page.keyboard.press("/");
    await expect(search(page)).toBeFocused();
    await page.keyboard.type("vault");
    await page.keyboard.press("Enter");
    await expect(count(page)).toContainText("for “vault”");

    // From there, Tab reaches the results in reading order, and each card is
    // its link and then its two buttons.
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return (
          el?.getAttribute("aria-label") ||
          el?.textContent?.trim().replace(/\s+/g, " ") ||
          el?.tagName ||
          ""
        );
      });
    const path: string[] = [];
    while (!path.some((name) => /^Compare /.test(name)) && path.length < 20) {
      await page.keyboard.press("Tab");
      path.push(await focused());
    }
    // ... the card's title link, Favorite, then Compare: one stop each.
    expect(path.slice(-3)[0]).toMatch(/Vault/);
    expect(path.slice(-2)[0]).toMatch(/^Favorite /);
    expect(path.slice(-1)[0]).toMatch(/^Compare /);

    // Space presses the focused button, and the next card is the next stop.
    await page.keyboard.press("Space");
    await expect(
      cards(page)
        .first()
        .getByRole("button", { name: /^Compare / }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Tab");
    expect(await focused()).toMatch(/Vault/);
    // Enter follows the focused link.
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/index\.html#item-/);
  });

  test("keeps the old results in place while new ones load, and says the count once", async ({
    page,
  }) => {
    await open(page, "latency=500");
    const before = await page
      .locator(".ccs-catalog-card__link")
      .allTextContents();
    // The first count is on the page and is not spoken.
    await expect(status(page)).toHaveText("");

    await check(page, /^Compute/);
    await expect(results(page)).toHaveAttribute("aria-busy", "true");
    // No skeleton, no blank: the same cards, dimmed.
    expect(
      await page.locator(".ccs-catalog-card__link").allTextContents(),
    ).toEqual(before);
    await expect(results(page)).toHaveClass(/ccs-catalog__results--stale/);
    await expect(page.getByLabel("Loading results")).toHaveCount(0);

    await expect(results(page)).toHaveAttribute("aria-busy", "false");
    // Two quick changes in a row are one announcement, of the last count.
    await check(page, /^Containers/);
    await check(page, /^Databases/);
    await expect(status(page)).toHaveText(/^[\d,]+ results?$/, {
      timeout: 5000,
    });
    const said = await count(page).textContent();
    await expect(status(page)).toHaveText(said as string);
  });

  test("an empty result explains itself and clears", async ({ page }) => {
    await open(page);
    await search(page).fill("zzzz-nothing");
    await expect(
      page.getByRole("heading", { name: "No results for “zzzz-nothing”" }),
    ).toBeVisible();
    await expect(status(page)).toHaveText("No results");
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    await expect(cards(page).first()).toBeVisible();
    await expect(search(page)).toHaveValue("");
  });

  test("back restores the place in a list that was loaded as it was read", async ({
    page,
  }) => {
    await open(page, "mode=button");
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole("button", { name: "Load more" }).click();
      await expect(cards(page)).toHaveCount(24 * (i + 2));
      // Focus moves to the first new card, so the next Tab reads on from it.
      await expect(
        cards(page)
          .nth(24 * (i + 1))
          .locator(".ccs-catalog-card__link"),
      ).toBeFocused();
    }
    await expect(page).toHaveURL(/page=4/);

    // Read to a card well down the list.
    const target = cards(page).nth(70);
    await target.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 37));
    const before = await firstInView(page);
    expect(before).not.toBeNull();
    // Let the position be saved on the pause, then leave through a card.
    await page.waitForTimeout(600);
    await target.locator(".ccs-catalog-card__link").click();
    await expect(page).toHaveURL(/index\.html#item-/);

    await page.goBack();
    await expect(cards(page)).toHaveCount(96);
    await expect
      .poll(async () => (await firstInView(page))?.index)
      .toBe(before?.index);
    const after = await firstInView(page);
    expect(Math.abs((after?.top ?? 0) - (before?.top ?? 0))).toBeLessThan(2);
  });

  test("a reload keeps the place too, and a new query starts at the top", async ({
    page,
  }) => {
    await open(page, "mode=button");
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(cards(page)).toHaveCount(48);
    await cards(page).nth(40).scrollIntoViewIfNeeded();
    const before = await firstInView(page);
    await page.waitForTimeout(600);

    await page.reload();
    await expect(cards(page)).toHaveCount(48);
    await expect
      .poll(async () => (await firstInView(page))?.index)
      .toBe(before?.index);

    await check(page, /^Compute/);
    await expect(page).toHaveURL(/category=Compute/);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(400);
  });

  test("with virtualization, 50 pages of infinite load keep the DOM small and Back still restores", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await open(page, "virtual=1");
    await loadItems(page, 1200);
    // Only the rows near the viewport are drawn.
    expect(await cards(page).count()).toBeLessThan(40);
    expect(
      await page.locator("[data-index]").first().getAttribute("aria-setsize"),
    ).toBe("5000");

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight * 0.4),
    );
    await expect.poll(() => firstInView(page)).not.toBeNull();
    const before = await firstInView(page);
    await page.waitForTimeout(600);
    const loaded = await page.locator(".ccs-catalog__progress").textContent();
    // Leave through a card that is in view, so the click does not scroll.
    await page
      .locator(`[data-index="${before?.index}"] .ccs-catalog-card__link`)
      .click();
    await expect(page).toHaveURL(/index\.html#item-/);

    await page.goBack();
    // The URL says how deep to load, so the same cards are back.
    await expect(page.locator(".ccs-catalog__progress")).toHaveText(
      loaded as string,
    );
    await expect
      .poll(async () => (await firstInView(page))?.index)
      .toBe(before?.index);
    const after = await firstInView(page);
    expect(Math.abs((after?.top ?? 0) - (before?.top ?? 0))).toBeLessThan(2);
  });

  test("the column count follows the width, and nothing overflows", async ({
    page,
  }) => {
    // The columns at the Carbon breakpoints: sm, md, lg and xlg.
    for (const [width, columns] of [
      [320, 1],
      [672, 2],
      [1056, 2],
      [1584, 4],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await open(page);
      const xs = await cards(page).evaluateAll((all) => [
        ...new Set(
          all.slice(0, 12).map((c) => Math.round(c.getBoundingClientRect().x)),
        ),
      ]);
      expect(xs.length, `columns at ${width}`).toBe(columns);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `no overflow at ${width}`,
      ).toBe(true);
    }
  });

  test("below the large breakpoint the facets are a flyout that returns focus", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await open(page);
    const trigger = page.getByRole("button", { name: /^Filters/ });
    await expect(page.getByRole("complementary")).toHaveCount(0);

    await trigger.click();
    await expect(page.locator(".bx--side-panel").first()).toBeVisible();
    await settle(page);
    await page
      .getByRole("checkbox", { name: /^Compute/ })
      .check({ force: true });
    await expect(page).toHaveURL(/category=Compute/);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("(1)");
  });

  test("renders at the inline end in right-to-left, and the focus ring covers the card", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const card = cards(page).first();
    const box = (await card.boundingBox()) as NonNullable<
      Awaited<ReturnType<typeof card.boundingBox>>
    >;
    const favorite = (await card
      .getByRole("button", { name: /^Favorite / })
      .boundingBox()) as NonNullable<
      Awaited<ReturnType<typeof card.boundingBox>>
    >;
    // The actions sit in the top corner at the end, which is the left.
    expect(favorite.x + favorite.width / 2).toBeLessThan(box.x + box.width / 2);

    await card.locator(".ccs-catalog-card__link").focus();
    const ring = await card
      .locator(".ccs-catalog-card__link")
      .evaluate((el) => {
        const after = getComputedStyle(el, "::after");
        return {
          style: after.outlineStyle,
          width: Number.parseFloat(after.outlineWidth),
          position: after.position,
        };
      });
    expect(ring).toEqual({ style: "solid", width: 2, position: "absolute" });
  });

  test("keeps a visible focus ring in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await cards(page).first().locator(".ccs-catalog-card__link").focus();
    const ring = await cards(page)
      .first()
      .locator(".ccs-catalog-card__link")
      .evaluate((el) => {
        const after = getComputedStyle(el, "::after");
        return { style: after.outlineStyle, width: after.outlineWidth };
      });
    expect(ring.style).toBe("solid");
    expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
  });

  test.describe("axe", () => {
    test("is clean in White, Gray 100 and right-to-left, with a query applied", async ({
      page,
    }) => {
      await open(page, "q=vault&category=Compute&category=Security");
      await expect(
        page
          .locator(
            ".ccs-catalog-card mark, .ccs-catalog-card .bx--highlight__mark",
          )
          .first(),
      ).toBeVisible();
      await settle(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await page.evaluate(() =>
        document.documentElement.classList.add("bx--g100"),
      );
      await settle(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      await settle(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });

    test("is clean while virtualized, empty, loading and in the flyout", async ({
      page,
    }) => {
      await open(page, "virtual=1");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await page.goto("/catalog-page.html?q=zzzz-nothing");
      await expect(
        page.getByRole("heading", { name: /No results/ }),
      ).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await page.goto("/catalog-page.html?latency=1500");
      await expect(page.getByLabel("Loading results")).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await page.setViewportSize({ width: 800, height: 900 });
      await open(page);
      await page.getByRole("button", { name: /^Filters/ }).click();
      await settle(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  });
});
