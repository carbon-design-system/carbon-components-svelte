import AxeBuilder from "@axe-core/playwright";
import { type Locator, type Page, test as base } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The overlay stack decides which open layer takes Escape and which closes on
// an outside click. Every case opens layers one on top of the other and
// checks that exactly the top one closes, and where focus goes.

const modal = (page: Page, heading: string) =>
  page
    .locator(".bx--modal")
    .filter({ has: page.getByRole("heading", { name: heading, exact: true }) });

const isOpen = (page: Page, heading: string) =>
  expect(modal(page, heading)).toHaveClass(/is-visible/);
const isClosed = (page: Page, heading: string) =>
  expect(modal(page, heading)).not.toHaveClass(/is-visible/);

const closeLog = (page: Page) => page.getByTestId("closed-log");

/** `clip` of an inline tooltip's text: `auto` while it shows. */
const tooltipClip = (button: Locator) =>
  button.evaluate(
    (el) =>
      getComputedStyle(el.querySelector(".bx--assistive-text") as Element).clip,
  );

async function openMenuModal(page: Page) {
  await page.getByTestId("open-menu-modal").click();
  await isOpen(page, "Menu in a modal");
}

async function openDeep(page: Page) {
  await page.getByTestId("open-deep").click();
  await isOpen(page, "Deep A");
  await page.getByTestId("open-deep-b").click();
  await isOpen(page, "Deep B");
  await page.getByTestId("toggle-deep-popover").click();
  await page.getByTestId("open-deep-menu").click();
  await expect(page.getByRole("menu", { name: "Deep actions" })).toBeVisible();
  const pin = page.getByRole("button", { name: "Deep pin" });
  await pin.focus();
  await expect.poll(() => tooltipClip(pin)).toBe("auto");
  return pin;
}

test.describe("Overlay stack", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/overlay-stack.html");
  });

  test.describe("a menu in a modal", () => {
    test("Escape closes the menu, then the modal, and focus follows", async ({
      page,
    }) => {
      await openMenuModal(page);
      await page.getByTestId("menu-trigger").click();
      const menu = page.getByRole("menu", { name: "Actions" });
      await expect(menu).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await isOpen(page, "Menu in a modal");
      await expect(page.getByTestId("menu-trigger")).toBeFocused();

      await page.keyboard.press("Escape");
      await isClosed(page, "Menu in a modal");
      await expect(page.getByTestId("open-menu-modal")).toBeFocused();
      await expect(closeLog(page)).toHaveText("menu-modal");
    });

    test("a press on the backdrop closes the menu, then the modal", async ({
      page,
    }) => {
      await openMenuModal(page);
      await page.getByTestId("menu-trigger").click();
      const menu = page.getByRole("menu", { name: "Actions" });
      await expect(menu).toBeVisible();

      await page.mouse.click(8, 400);
      await expect(menu).toBeHidden();
      await isOpen(page, "Menu in a modal");

      await page.mouse.click(8, 400);
      await isClosed(page, "Menu in a modal");
    });

    test("a click inside the modal closes only the menu", async ({ page }) => {
      await openMenuModal(page);
      await page.getByTestId("menu-trigger").click();
      const menu = page.getByRole("menu", { name: "Actions" });
      await expect(menu).toBeVisible();

      await page.getByRole("heading", { name: "Menu in a modal" }).click();
      await expect(menu).toBeHidden();
      await isOpen(page, "Menu in a modal");
      await expect(closeLog(page)).toHaveText("");
    });
  });

  test("a tooltip on a button in a menu in a modal takes the first Escape", async ({
    page,
  }) => {
    await openMenuModal(page);
    await page.getByTestId("menu-trigger").click();
    const menu = page.getByRole("menu", { name: "Actions" });
    const pin = page.getByRole("button", { name: "Pin item" });
    await pin.focus();
    await expect.poll(() => tooltipClip(pin)).toBe("auto");

    await page.keyboard.press("Escape");
    await expect.poll(() => tooltipClip(pin)).not.toBe("auto");
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await isOpen(page, "Menu in a modal");
    await expect(page.getByTestId("menu-trigger")).toBeFocused();

    await page.keyboard.press("Escape");
    await isClosed(page, "Menu in a modal");
    await expect(page.getByTestId("open-menu-modal")).toBeFocused();
  });

  test("the tooltip of the button that opened a menu waits for the menu to close", async ({
    page,
  }) => {
    await openMenuModal(page);
    const trigger = page.getByRole("button", { name: "Row actions" });
    await trigger.focus();
    await expect.poll(() => tooltipClip(trigger)).toBe("auto");
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Duplicate options" });
    await expect(menu).toBeVisible();

    // The menu opened after the tooltip, so it takes the first key. Focus the
    // menu hands back does not ask for the tooltip, so the next one is the
    // modal's.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await isOpen(page, "Menu in a modal");
    await expect(trigger).toBeFocused();
    await expect.poll(() => tooltipClip(trigger)).not.toBe("auto");

    await page.keyboard.press("Escape");
    await isClosed(page, "Menu in a modal");
  });

  test.describe("a side panel and a modal", () => {
    test("Escape closes the modal, then the panel, and focus follows", async ({
      page,
    }) => {
      await page.getByTestId("open-panel").click();
      await expect(
        page.getByRole("heading", { name: "Side panel" }),
      ).toBeVisible();

      await page.getByTestId("open-panel-modal").click();
      await isOpen(page, "Modal over a panel");
      // The panel is behind the modal now.
      await expect(page.locator(".bx--side-panel")).toHaveJSProperty(
        "inert",
        true,
      );

      await page.keyboard.press("Escape");
      await isClosed(page, "Modal over a panel");
      await expect(page.getByTestId("open-panel-modal")).toBeFocused();
      await expect(page.locator(".bx--side-panel")).toHaveJSProperty(
        "inert",
        false,
      );
      await expect(
        page.getByRole("heading", { name: "Side panel" }),
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("open-panel")).toBeFocused();
      await expect(closeLog(page)).toHaveText("panel-modal,panel");
    });

    test("scroll stays locked until both are closed", async ({ page }) => {
      const locked = /bx--body--with-modal-open/;
      await page.getByTestId("open-panel").click();
      await page.getByTestId("open-panel-modal").click();
      await expect(page.locator("body")).toHaveClass(locked);

      await page.keyboard.press("Escape");
      await expect(page.locator("body")).toHaveClass(locked);

      await page.keyboard.press("Escape");
      await expect(page.locator("body")).not.toHaveClass(locked);
    });
  });

  test("a menu in a native dialog over a modal: Escape closes the menu, the dialog, then the modal", async ({
    page,
  }) => {
    await page.getByTestId("open-under-dialog").click();
    await isOpen(page, "Under a dialog");
    await page.getByTestId("open-dialog").click();
    const dialog = page.getByRole("dialog", { name: "Native dialog" });
    await expect(dialog).toBeVisible();
    await page.getByTestId("dialog-menu-trigger").click();
    const menu = page.getByRole("menu", { name: "Dialog actions" });
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(dialog).toBeVisible();

    // The browser closes the dialog, and the modal under it stays.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await isOpen(page, "Under a dialog");
    await expect(page.getByTestId("open-dialog")).toBeFocused();

    await page.keyboard.press("Escape");
    await isClosed(page, "Under a dialog");
    // The dialog reports its close a task after the browser closes it.
    await expect
      .poll(async () =>
        ((await closeLog(page).textContent()) ?? "").split(",").sort(),
      )
      .toEqual(["dialog", "under-dialog"]);
  });

  test.describe("a ComboBox in a modal", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId("open-combo-modal").click();
      await isOpen(page, "ComboBox in a modal");
    });

    test("Escape closes the list, then the modal", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: "Contact" });
      await combobox.click();
      await expect(page.getByRole("option", { name: "Email" })).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("option", { name: "Email" })).toBeHidden();
      await isOpen(page, "ComboBox in a modal");
      await expect(combobox).toBeFocused();

      await page.keyboard.press("Escape");
      await isClosed(page, "ComboBox in a modal");
      await expect(page.getByTestId("open-combo-modal")).toBeFocused();
    });

    test("a press on the backdrop closes the list, then the modal", async ({
      page,
    }) => {
      await page.getByRole("combobox", { name: "Contact" }).click();
      await expect(page.getByRole("option", { name: "Email" })).toBeVisible();

      await page.mouse.click(8, 400);
      await expect(page.getByRole("option", { name: "Email" })).toBeHidden();
      await isOpen(page, "ComboBox in a modal");

      await page.mouse.click(8, 400);
      await isClosed(page, "ComboBox in a modal");
    });
  });

  test("a DatePicker in a modal closes its calendar before the modal", async ({
    page,
  }) => {
    await page.getByTestId("open-date-modal").click();
    await isOpen(page, "DatePicker in a modal");
    const input = page.getByRole("textbox", { name: "Date" });
    await input.click();
    const calendar = page.locator(".bx--date-picker__calendar--open");
    await expect(calendar).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(calendar).toBeHidden();
    await isOpen(page, "DatePicker in a modal");
    await expect(input).toBeFocused();

    await page.keyboard.press("Escape");
    await isClosed(page, "DatePicker in a modal");
    await expect(page.getByTestId("open-date-modal")).toBeFocused();
  });

  test.describe("a HoverCard over a page with a popover", () => {
    test("Escape closes the card, then the popover", async ({ page }) => {
      await page.getByTestId("toggle-page-popover").click();
      await expect(page.getByTestId("page-popover")).toBeVisible();

      await page.getByTestId("hovercard-trigger").focus();
      await expect(page.getByTestId("hovercard")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("hovercard")).toBeHidden();
      await expect(page.getByTestId("page-popover")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("page-popover")).toBeHidden();
    });

    test("a click on the popover closes the card and leaves the popover", async ({
      page,
    }) => {
      await page.getByTestId("toggle-page-popover").click();
      await page.getByTestId("hovercard-trigger").focus();
      await expect(page.getByTestId("hovercard")).toBeVisible();

      await page.getByTestId("page-popover").click();
      await expect(page.getByTestId("hovercard")).toBeHidden();
      await expect(page.getByTestId("page-popover")).toBeVisible();
    });

    test("Escape from inside the card returns focus to its trigger", async ({
      page,
    }) => {
      await page.getByTestId("hovercard-trigger").focus();
      await page.getByRole("button", { name: "Follow" }).focus();

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("hovercard")).toBeHidden();
      await expect(page.getByTestId("hovercard-trigger")).toBeFocused();
    });
  });

  test.describe("five layers deep", () => {
    test("Escape closes one layer at a time, and focus returns at each", async ({
      page,
    }) => {
      const pin = await openDeep(page);
      const menu = page.getByRole("menu", { name: "Deep actions" });

      await page.keyboard.press("Escape");
      await expect.poll(() => tooltipClip(pin)).not.toBe("auto");
      await expect(menu).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(page.getByTestId("open-deep-menu")).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("toggle-deep-popover")).toBeFocused();
      await isOpen(page, "Deep B");

      await page.keyboard.press("Escape");
      await isClosed(page, "Deep B");
      await isOpen(page, "Deep A");
      await expect(page.getByTestId("open-deep-b")).toBeFocused();

      await page.keyboard.press("Escape");
      await isClosed(page, "Deep A");
      await expect(page.getByTestId("open-deep")).toBeFocused();
      await expect(closeLog(page)).toHaveText(
        "deep-menu,deep-popover,deep-b,deep-a",
      );
    });

    test("an outside click on a lower layer closes only the layers above it", async ({
      page,
    }) => {
      await openDeep(page);

      // The Deep B heading belongs to the lower modal.
      await modal(page, "Deep B")
        .locator(".bx--modal-header")
        .click({ position: { x: 8, y: 8 } });
      await expect(
        page.getByRole("menu", { name: "Deep actions" }),
      ).toBeHidden();
      await isOpen(page, "Deep B");
      await isOpen(page, "Deep A");
      await expect(closeLog(page)).toHaveText("deep-menu,deep-popover");
    });

    test("rapid Escape closes each layer once and leaves nothing open", async ({
      page,
    }) => {
      await openDeep(page);

      for (let i = 0; i < 12; i++) await page.keyboard.press("Escape");

      await isClosed(page, "Deep A");
      await isClosed(page, "Deep B");
      await expect(closeLog(page)).toHaveText(
        "deep-menu,deep-popover,deep-b,deep-a",
      );
      await expect(page.getByTestId("open-deep")).toBeFocused();
      await expect(page.locator("body")).not.toHaveClass(
        /bx--body--with-modal-open/,
      );
      await expect(page.locator("[inert]")).toHaveCount(
        await page.locator(".bx--modal[inert]").count(),
      );
    });

    test("the page behind is inert and Tab stays in the top modal", async ({
      page,
    }) => {
      await page.getByTestId("open-deep").click();
      await isOpen(page, "Deep A");
      await page.getByTestId("open-deep-b").click();
      await isOpen(page, "Deep B");

      await expect(page.locator("main")).toHaveJSProperty("inert", true);
      await expect(modal(page, "Deep A")).toHaveJSProperty("inert", true);

      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(
          () =>
            !!document.activeElement?.closest(
              ".bx--modal.is-visible:not([inert])",
            ),
        );
        expect(inside).toBe(true);
      }

      // Focus is on the close button, whose tooltip takes the first Escape.
      await page.getByTestId("toggle-deep-popover").focus();
      await page.keyboard.press("Escape");
      await isClosed(page, "Deep B");
      await expect(modal(page, "Deep A")).toHaveJSProperty("inert", false);
      await expect(page.locator("main")).toHaveJSProperty("inert", true);
    });
  });

  test.describe("accessibility", () => {
    test("has no violations with a ComboBox list open in a modal", async ({
      page,
    }) => {
      await page.getByTestId("open-combo-modal").click();
      await isOpen(page, "ComboBox in a modal");
      await page.getByRole("combobox", { name: "Contact" }).click();
      await expect(page.getByRole("option", { name: "Email" })).toBeVisible();

      const results = await new AxeBuilder({ page })
        // Portalled lists sit outside the fixture's landmark, as in the
        // other modal checks, which scope axe to #app.
        .disableRules(["region"])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test("has no violations with a modal over a side panel", async ({
      page,
    }) => {
      await page.getByTestId("open-panel").click();
      await page.getByTestId("open-panel-modal").click();
      await isOpen(page, "Modal over a panel");

      const results = await new AxeBuilder({ page })
        // Portalled lists sit outside the fixture's landmark, as in the
        // other modal checks, which scope axe to #app.
        .disableRules(["region"])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test("has no violations with a HoverCard over a page popover", async ({
      page,
    }) => {
      await page.getByTestId("toggle-page-popover").click();
      await page.getByTestId("hovercard-trigger").focus();
      await expect(page.getByTestId("hovercard")).toBeVisible();

      const results = await new AxeBuilder({ page })
        // Portalled lists sit outside the fixture's landmark, as in the
        // other modal checks, which scope axe to #app.
        .disableRules(["region"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe("right to left, dark theme and forced colors", () => {
    test("Escape order holds with dir=rtl and the g100 theme", async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.classList.add("bx--g100");
      });
      const pin = await openDeep(page);
      const menu = page.getByRole("menu", { name: "Deep actions" });

      await page.keyboard.press("Escape");
      await expect.poll(() => tooltipClip(pin)).not.toBe("auto");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await page.keyboard.press("Escape");
      await isOpen(page, "Deep B");
      await page.keyboard.press("Escape");
      await isClosed(page, "Deep B");
      await isOpen(page, "Deep A");
    });

    test("Escape order holds in forced colors", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await openMenuModal(page);
      await page.getByTestId("menu-trigger").click();
      const menu = page.getByRole("menu", { name: "Actions" });
      await expect(menu).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await isOpen(page, "Menu in a modal");
      await page.keyboard.press("Escape");
      await isClosed(page, "Menu in a modal");
    });
  });
});

// Touch has its own page: the shared host page is not a touch context.
base.describe("Overlay stack with touch", () => {
  base.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

  base(
    "a tap outside closes the layers above the one tapped",
    async ({ page }) => {
      await page.goto("/overlay-stack.html");
      await page.getByTestId("open-menu-modal").tap();
      await isOpen(page, "Menu in a modal");
      await page.getByTestId("menu-trigger").tap();
      const menu = page.getByRole("menu", { name: "Actions" });
      await expect(menu).toBeVisible();

      await page.touchscreen.tap(8, 400);
      await expect(menu).toBeHidden();
      await isOpen(page, "Menu in a modal");

      await page.touchscreen.tap(8, 400);
      await isClosed(page, "Menu in a modal");
    },
  );

  base("a tap on a page popover's outside closes it", async ({ page }) => {
    await page.goto("/overlay-stack.html");
    await page.getByTestId("toggle-page-popover").tap();
    await expect(page.getByTestId("page-popover")).toBeVisible();

    await page.touchscreen.tap(900, 600);
    await expect(page.getByTestId("page-popover")).toBeHidden();
  });

  base(
    "a scroll that starts outside closes nothing",
    async ({ page, browserName }) => {
      base.skip(browserName !== "chromium", "Touch events come from CDP");
      await page.goto("/overlay-stack.html");
      await page.getByTestId("toggle-page-popover").tap();
      await expect(page.getByTestId("page-popover")).toBeVisible();

      // A touch drag fires pointerdown, but no click.
      const client = await page.context().newCDPSession(page);
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 600, y: 600 }],
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 600, y: 300 }],
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect(page.getByTestId("page-popover")).toBeVisible();
    },
  );
});
