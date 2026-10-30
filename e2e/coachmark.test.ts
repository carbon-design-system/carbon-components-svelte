import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const dialog = (page: Page, id: string) => page.locator(`#${id}-content`);

/** The box sits inside the window. */
async function expectInViewport(page: Page, box: Locator) {
  const rect = await box.boundingBox();
  const viewport = page.viewportSize();
  expect(rect).not.toBeNull();
  if (!(rect && viewport)) return;
  expect(rect.x).toBeGreaterThanOrEqual(-0.5);
  expect(rect.y).toBeGreaterThanOrEqual(-0.5);
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 0.5);
}

test.describe("Coachmark", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/coachmark.html");
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("anchored", () => {
    test("opens from the beacon, takes focus and returns it on Escape", async ({
      page,
    }) => {
      const beacon = page
        .getByRole("button", { name: "Show coachmark" })
        .first();
      await beacon.click();

      await expect(dialog(page, "cm-basic")).toBeVisible();
      await expect(page.getByRole("button", { name: "Try it" })).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(dialog(page, "cm-basic")).toBeHidden();
      await expect(beacon).toBeFocused();
      await expect(page.getByTestId("events")).toHaveText(
        "basic:open:target,basic:close:escape-key",
      );
    });

    test("keeps Escape from an unrelated field to itself", async ({ page }) => {
      await page
        .getByRole("button", { name: "Show coachmark" })
        .first()
        .click();
      await expect(dialog(page, "cm-basic")).toBeVisible();

      await page.getByTestId("unrelated").focus();
      await page.keyboard.press("Escape");

      await expect(dialog(page, "cm-basic")).toBeVisible();
    });

    test("works by keyboard alone", async ({ page }) => {
      const beacon = page
        .getByRole("button", { name: "Show coachmark" })
        .first();
      await beacon.focus();
      await page.keyboard.press("Enter");

      await expect(page.getByRole("button", { name: "Try it" })).toBeFocused();
      await page.keyboard.press("Escape");

      await expect(dialog(page, "cm-basic")).toBeHidden();
      await expect(beacon).toBeFocused();
    });

    test("closes on an outside click and leaves focus alone", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Show coachmark" })
        .first()
        .click();
      await expect(dialog(page, "cm-basic")).toBeVisible();

      await page.getByTestId("unrelated").click();

      await expect(dialog(page, "cm-basic")).toBeHidden();
      await expect(page.getByTestId("unrelated")).toBeFocused();
    });
  });

  test.describe("anchored to other controls", () => {
    test("a DataTable toolbar button", async ({ page }) => {
      await page.getByRole("button", { name: "Filter" }).click();

      const content = dialog(page, "cm-toolbar");
      await expect(content).toBeVisible();
      await expectInViewport(page, content);
      // Nothing in the table paints over it.
      const box = await content.boundingBox();
      const top = await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest("[role=dialog]")?.id,
        { x: (box?.x ?? 0) + 20, y: (box?.y ?? 0) + (box?.height ?? 0) - 10 },
      );
      expect(top).toBe("cm-toolbar-content");
    });

    test("a UI Shell header action", async ({ page }) => {
      await page.getByRole("button", { name: "Notifications" }).click();

      const content = dialog(page, "cm-header");
      await expect(content).toBeVisible();
      await expectInViewport(page, content);
    });

    test("a tab, opened by the tour, without nesting a control in it", async ({
      page,
    }) => {
      await page.getByTestId("show-tab-tip").click();

      const content = dialog(page, "cm-tab");
      await expect(content).toBeVisible();
      await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
      // The portalled dialog does not feed the tab's name or sit inside it.
      expect(await content.evaluate((el) => !!el.closest("[role=tab]"))).toBe(
        false,
      );

      await page.getByRole("tab", { name: "Settings" }).click();
      await expect(content).toBeHidden();
    });

    test("an overlay beacon sits on the corner of its control", async ({
      page,
    }) => {
      const share = await page
        .getByRole("button", { name: "Share", exact: true })
        .boundingBox();
      const beacon = page.getByRole("button", {
        name: "Show what is new about Share",
      });
      const box = await beacon.boundingBox();

      expect(box && share).toBeTruthy();
      if (!(box && share)) return;
      expect(box.x + box.width / 2).toBeCloseTo(share.x + share.width, 0);
      expect(box.y + box.height / 2).toBeCloseTo(share.y, 0);

      await beacon.click();
      await expect(dialog(page, "cm-overlay")).toBeVisible();
    });
  });

  test.describe("a tour driven by the consumer", () => {
    test("hands focus from one coachmark to the next", async ({ page }) => {
      await page.getByTestId("start-tour").click();

      const stop = async (i: number, name: string, button: string) => {
        await expect(dialog(page, `cm-tour-${i}`)).toBeVisible();
        await expect(
          dialog(page, `cm-tour-${i}`).getByRole("button", { name: button }),
        ).toBeFocused();
        await expect(
          page.getByRole("heading", { name: `${name} stop` }),
        ).toBeVisible();
        await page.keyboard.press("Enter");
      };

      await stop(0, "First", "Next");
      await stop(1, "Second", "Next");
      await stop(2, "Third", "Finish");

      await expect(page.locator(".bx--popover--open")).toHaveCount(0);
      // The consumer closed the last stop from code, with focus inside it.
      await expect(page.locator("#cm-tour-2-target")).toBeFocused();
    });
  });

  test.describe("persisted dismissal", () => {
    test("opens until closed, then stays shut after a reload", async ({
      page,
    }) => {
      await page.reload();
      await expect(dialog(page, "cm-persist")).toBeVisible();
      // An auto-opened coachmark leaves focus where it was.
      await expect(page.locator("body")).toBeFocused();

      await dialog(page, "cm-persist")
        .getByRole("button", { name: "Close" })
        .click();
      await expect(page.getByTestId("seen")).toHaveText("seen");

      await page.reload();
      await expect(page.getByTestId("seen")).toHaveText("seen");
      await expect(dialog(page, "cm-persist")).toBeHidden();
    });
  });

  test.describe("appearance", () => {
    test("RTL swaps start alignment and the overlay corner", async ({
      page,
    }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );

      const share = await page
        .getByRole("button", { name: "Share", exact: true })
        .boundingBox();
      const box = await page
        .getByRole("button", { name: "Show what is new about Share" })
        .boundingBox();
      expect(box && share).toBeTruthy();
      if (!(box && share)) return;
      expect(box.x + box.width / 2).toBeCloseTo(share.x, 0);

      const beacon = page
        .getByRole("button", { name: "Show coachmark" })
        .first();
      await beacon.click();
      const content = await dialog(page, "cm-basic")
        .locator(".bx--popover-contents")
        .boundingBox();
      const anchor = await beacon.boundingBox();
      // `bottom-start` lines up with the beacon's inline start, the right, in RTL.
      expect(content && anchor).toBeTruthy();
      if (!(content && anchor)) return;
      expect(
        Math.abs(content.x + content.width - (anchor.x + anchor.width)),
      ).toBeLessThanOrEqual(2);
    });

    test("reduced motion stills the beacon's ring", async ({ page }) => {
      const ring = page.locator(".bx--coachmark-beacon__ring").first();
      expect(
        await ring.evaluate((el) => getComputedStyle(el).animationName),
      ).toBe("coachmark-beacon-pulse");

      await page.emulateMedia({ reducedMotion: "reduce" });

      expect(
        await ring.evaluate((el) => getComputedStyle(el).animationName),
      ).toBe("none");
      expect(await ring.evaluate((el) => getComputedStyle(el).opacity)).toBe(
        "0.4",
      );
    });

    test("forced colors keep the beacon, the border and the close icon", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await page
        .getByRole("button", { name: "Show coachmark" })
        .first()
        .click();

      const read = (selector: string) =>
        page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) throw new Error(`no ${sel}`);
          const s = getComputedStyle(el);
          return {
            background: s.backgroundColor,
            outline: `${s.outlineStyle} ${s.outlineWidth}`,
            fill: s.fill,
          };
        }, selector);
      const probe = (name: string) =>
        page.evaluate((color) => {
          const el = document.createElement("div");
          el.style.backgroundColor = color;
          document.body.append(el);
          const value = getComputedStyle(el).backgroundColor;
          el.remove();
          return value;
        }, name);

      const core = await read(".bx--coachmark-beacon__core");
      expect(core.background).toBe(await probe("ButtonText"));
      const ring = await read(".bx--coachmark-beacon__ring");
      expect(ring.background).toBe(await probe("Highlight"));
      // The popover has no shadow here, so its outline is the edge.
      const contents = await read("#cm-basic-content .bx--popover-contents");
      expect(contents.outline).not.toContain("none");
      const close = await page.evaluate(() => {
        const svg = document.querySelector(
          "#cm-basic-content .bx--coachmark__close svg",
        );
        return svg ? getComputedStyle(svg).fill : null;
      });
      expect(close).toBe(await probe("ButtonText"));
    });
  });
});

test.describe("Coachmark at the edges", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/coachmark-edge.html");
  });

  for (const [id, name] of [
    ["cm-start", "Top start"],
    ["cm-end", "Top end"],
    ["cm-bottom", "Bottom start"],
  ] as const) {
    test(`${name} stays in the window`, async ({ page }) => {
      await page
        .getByTestId(id)
        .getByRole("button", { name: "Show coachmark" })
        .click();

      const content = dialog(page, id);
      await expect(content).toBeVisible();
      await expectInViewport(page, content);
    });
  }

  test("a box that clips it moves it to a portal", async ({ page }) => {
    await page
      .getByTestId("cm-clip")
      .getByRole("button", { name: "Show coachmark" })
      .click();

    const content = dialog(page, "cm-clip");
    await expect(content).toBeVisible();
    expect(
      await content.evaluate((el) => !!el.closest("[data-testid=clip]")),
    ).toBe(false);
    await expectInViewport(page, content);
  });

  test.describe("in a Modal", () => {
    test("Escape closes the coachmark before the modal", async ({ page }) => {
      await page.getByTestId("open-modal").click();
      await expect(
        page.getByRole("dialog", { name: "Settings" }),
      ).toBeVisible();

      const beacon = page
        .getByTestId("cm-modal")
        .getByRole("button", { name: "Show coachmark" });
      await beacon.click();
      const content = dialog(page, "cm-modal");
      await expect(content).toBeVisible();
      // It sits above the modal.
      const box = await content.boundingBox();
      const top = await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest("[role=dialog]")?.id,
        { x: (box?.x ?? 0) + 20, y: (box?.y ?? 0) + 20 },
      );
      expect(top).toBe("cm-modal-content");

      await page.keyboard.press("Escape");
      await expect(content).toBeHidden();
      await expect(beacon).toBeFocused();
      await expect(page.getByTestId("modal-closed")).toHaveText("0");

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("modal-closed")).toHaveText("1");
    });

    test("closing the modal closes the coachmark", async ({ page }) => {
      await page.getByTestId("open-modal").click();
      await page
        .getByTestId("cm-modal")
        .getByRole("button", { name: "Show coachmark" })
        .click();
      await expect(dialog(page, "cm-modal")).toBeVisible();

      await page.locator(".bx--modal-close").click();

      await expect(dialog(page, "cm-modal")).toHaveCount(0);
    });
  });
});
