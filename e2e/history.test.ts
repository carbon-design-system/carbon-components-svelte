import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The platform the action reads at keydown. Chromium reports its own through
// `userAgentData`, so both are replaced, and restored in `afterEach`.
async function pretendPlatform(page: Page, platform: "Win32" | "MacIntel") {
  await page.evaluate((name) => {
    Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      get: () => undefined,
    });
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      get: () => name,
    });
  }, platform);
}

test.describe("History", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/history.html");
    await expect(page.getByTestId("commands")).toBeVisible();
    // The host page's user agent is Chrome on Windows whatever the machine,
    // so the page reads the platform whose key `ControlOrMeta` presses.
    await pretendPlatform(
      page,
      process.platform === "darwin" ? "MacIntel" : "Win32",
    );
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      Reflect.deleteProperty(navigator, "platform");
      Reflect.deleteProperty(navigator, "userAgentData");
    });
  });

  test.describe("commands", () => {
    test("undo and redo from the buttons and the keyboard, with labels and an announcement", async ({
      page,
    }) => {
      const list = page.getByTestId("commands");
      const undo = list.getByRole("button", { name: /^Undo/ });
      await expect(undo).toBeDisabled();

      await list
        .getByRole("button", { name: "Move Ada Lovelace down", exact: true })
        .click();
      await expect(list.locator("li span")).toHaveText([
        "Grace Hopper",
        "Ada Lovelace",
        "Katherine Johnson",
      ]);
      await expect(undo).toHaveText("Undo move Ada Lovelace down");

      await list
        .getByRole("button", { name: "Delete Grace Hopper", exact: true })
        .click();
      await expect(list.locator("li span")).toHaveText([
        "Ada Lovelace",
        "Katherine Johnson",
      ]);

      // Focus stays in the region after the delete button is gone.
      await expect(list.locator("[tabindex='-1']")).toBeFocused();
      await page.keyboard.press("ControlOrMeta+z");
      await expect(list.locator("li span")).toHaveText([
        "Grace Hopper",
        "Ada Lovelace",
        "Katherine Johnson",
      ]);
      await expect(list.getByRole("status")).toHaveText(
        "Undid delete Grace Hopper",
      );

      await page.keyboard.press("ControlOrMeta+z");
      await expect(list.locator("li span")).toHaveText([
        "Ada Lovelace",
        "Grace Hopper",
        "Katherine Johnson",
      ]);
      await expect(undo).toBeDisabled();

      await page.keyboard.press("ControlOrMeta+Shift+z");
      await page.keyboard.press("ControlOrMeta+Shift+z");
      await expect(list.locator("li span")).toHaveText([
        "Ada Lovelace",
        "Katherine Johnson",
      ]);
      await expect(list.getByRole("status")).toHaveText(
        "Redid delete Grace Hopper",
      );
    });

    test("a new action after an undo drops the redo steps", async ({
      page,
    }) => {
      const list = page.getByTestId("commands");
      await list
        .getByRole("button", { name: "Delete Ada Lovelace", exact: true })
        .click();
      await expect(list.locator("[tabindex='-1']")).toBeFocused();
      await page.keyboard.press("ControlOrMeta+z");
      const redo = list.getByRole("button", { name: /^Redo/ });
      await expect(redo).toBeEnabled();

      await list.getByLabel("Name").fill("Edsger Dijkstra");
      await list.getByRole("button", { name: "Add", exact: true }).click();
      await expect(redo).toBeDisabled();
    });

    test("sorting is one step, however many moves it takes", async ({
      page,
    }) => {
      const list = page.getByTestId("commands");
      await list
        .getByRole("button", { name: "Sort by name", exact: true })
        .click();
      await expect(list.locator("li span")).toHaveText([
        "Ada Lovelace",
        "Grace Hopper",
        "Katherine Johnson",
      ]);
      // Already sorted: nothing was recorded.
      await expect(list.getByRole("button", { name: /^Undo/ })).toBeDisabled();

      await list
        .getByRole("button", { name: "Move Katherine Johnson up", exact: true })
        .click();
      await list
        .getByRole("button", { name: "Move Katherine Johnson up", exact: true })
        .click();
      await list
        .getByRole("button", { name: "Sort by name", exact: true })
        .click();
      await expect(list.locator("li span")).toHaveText([
        "Ada Lovelace",
        "Grace Hopper",
        "Katherine Johnson",
      ]);
      await list.getByRole("button", { name: /^Undo/ }).click();
      await expect(list.locator("li span")).toHaveText([
        "Katherine Johnson",
        "Ada Lovelace",
        "Grace Hopper",
      ]);
    });
  });

  test.describe("bindings by platform", () => {
    test("Windows and Linux: Control+Z, Control+Shift+Z and Control+Y", async ({
      page,
    }) => {
      await pretendPlatform(page, "Win32");
      const list = page.getByTestId("commands");
      await list
        .getByRole("button", { name: "Move Ada Lovelace down", exact: true })
        .click();
      await expect(
        list.getByRole("button", {
          name: "Move Ada Lovelace down",
          exact: true,
        }),
      ).toBeFocused();

      await page.keyboard.press("Meta+z");
      await expect(list.locator("li span").first()).toHaveText("Grace Hopper");
      await page.keyboard.press("Control+z");
      await expect(list.locator("li span").first()).toHaveText("Ada Lovelace");
      await page.keyboard.press("Control+y");
      await expect(list.locator("li span").first()).toHaveText("Grace Hopper");
      await page.keyboard.press("Control+z");
      await page.keyboard.press("Control+Shift+z");
      await expect(list.locator("li span").first()).toHaveText("Grace Hopper");
    });

    test("macOS: Command+Z and Command+Shift+Z, and Control+Y is left alone", async ({
      page,
    }) => {
      await pretendPlatform(page, "MacIntel");
      const list = page.getByTestId("commands");
      await list
        .getByRole("button", { name: "Move Ada Lovelace down", exact: true })
        .click();
      await expect(
        list.getByRole("button", {
          name: "Move Ada Lovelace down",
          exact: true,
        }),
      ).toBeFocused();

      await page.keyboard.press("Control+z");
      await expect(list.locator("li span").first()).toHaveText("Grace Hopper");
      await page.keyboard.press("Meta+z");
      await expect(list.locator("li span").first()).toHaveText("Ada Lovelace");
      await page.keyboard.press("Control+y");
      await expect(list.locator("li span").first()).toHaveText("Ada Lovelace");
      await page.keyboard.press("Meta+Shift+z");
      await expect(list.locator("li span").first()).toHaveText("Grace Hopper");
    });
  });

  test.describe("snapshots and typing in a field", () => {
    test("the form's history folds a burst of typing into one step", async ({
      page,
    }) => {
      const form = page.getByTestId("snapshots");
      const name = form.getByLabel("Name");
      await name.click();
      await page.keyboard.type("Ada");
      await page.waitForTimeout(800);
      await page.keyboard.type(" Lovelace");
      await expect(name).toHaveValue("Ada Lovelace");

      await page.keyboard.press("ControlOrMeta+z");
      await expect(name).toHaveValue("Ada");
      await expect(form.getByRole("status")).toHaveText("Undid edit name");

      await page.keyboard.press("ControlOrMeta+z");
      await expect(name).toHaveValue("");
      await expect(form.getByRole("button", { name: /^Undo/ })).toBeDisabled();

      await page.keyboard.press("ControlOrMeta+Shift+z");
      await expect(name).toHaveValue("Ada");
      await page.keyboard.press("ControlOrMeta+Shift+z");
      await expect(name).toHaveValue("Ada Lovelace");
    });

    test("a step per field, and a checkbox is a step each time", async ({
      page,
    }) => {
      const form = page.getByTestId("snapshots");
      await form.getByLabel("Name").click();
      await page.keyboard.type("Ada");
      await form.getByLabel("Email").click();
      await page.keyboard.type("ada@example.com");
      await form.getByText("Send me product updates").click();
      await expect(form.getByLabel("Send me product updates")).toBeChecked();

      // Focus is on the checkbox: the history handles the key.
      await page.keyboard.press("ControlOrMeta+z");
      await expect(
        form.getByLabel("Send me product updates"),
      ).not.toBeChecked();
      await page.keyboard.press("ControlOrMeta+z");
      await expect(form.getByLabel("Email")).toHaveValue("");
      await expect(form.getByLabel("Name")).toHaveValue("Ada");
    });

    test('with "native", the browser undoes its own typing and the history does not run', async ({
      page,
    }) => {
      const form = page.getByTestId("snapshots");
      await form.getByText("The browser only").click();
      const name = form.getByLabel("Name");
      await name.click();
      await page.keyboard.type("Ada");
      await expect(form.getByRole("button", { name: /^Undo/ })).toHaveText(
        "Undo edit name",
      );

      await page.keyboard.press("ControlOrMeta+z");
      await expect(name).toHaveValue("");
      // The history did not undo: its status never said so.
      await expect(form.getByRole("status")).toHaveText("Nothing undone yet.");
    });

    test('"fallthrough" lets the browser undo typing first', async ({
      page,
    }) => {
      const section = page.getByTestId("fallthrough");
      const field = section.getByLabel("Committed on change");
      await field.click();
      await page.keyboard.type("abc");
      await field.blur();
      await expect(page.getByTestId("committed-undoable")).toHaveText("true");

      await field.focus();
      await page.keyboard.type("d");
      await page.keyboard.press("ControlOrMeta+z");
      await page.waitForTimeout(100);
      // The browser took the key, so the history was not applied.
      await expect(page.getByTestId("applied")).toHaveText("");
    });

    test('"fallthrough" undoes the history when the browser has nothing to undo', async ({
      page,
    }) => {
      const section = page.getByTestId("fallthrough");
      await section
        .getByRole("button", { name: "Record x", exact: true })
        .click();
      await expect(page.getByTestId("committed")).toHaveText("x");

      await section.getByLabel("Committed on change").focus();
      await page.keyboard.press("ControlOrMeta+z");
      await expect(page.getByTestId("committed")).toHaveText("");
      await expect(page.getByTestId("applied")).toHaveText("");
    });
  });

  test.describe("gestures", () => {
    async function thumb(page: Page) {
      const handle = page
        .getByTestId("gesture")
        .getByRole("slider", { name: "Opacity" });
      await handle.scrollIntoViewIfNeeded();
      const box = await handle.boundingBox();
      if (!box) throw new Error("no thumb");
      return {
        handle,
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };
    }

    test("a drag is one step, undone in one press", async ({ page }) => {
      const section = page.getByTestId("gesture");
      const { handle, x, y } = await thumb(page);
      await expect(handle).toHaveAttribute("aria-valuenow", "40");

      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let i = 1; i <= 20; i++) await page.mouse.move(x + i * 6, y);
      await page.mouse.up();
      const dragged = Number(await handle.getAttribute("aria-valuenow"));
      expect(dragged).toBeGreaterThan(40);
      await expect(section.getByText("Drags kept as steps: 1")).toBeVisible();

      await section.getByRole("button", { name: "Undo" }).click();
      await expect(handle).toHaveAttribute("aria-valuenow", "40");
      await expect(
        section.getByRole("button", { name: "Undo" }),
      ).toBeDisabled();
      await section.getByRole("button", { name: "Redo" }).click();
      await expect(handle).toHaveAttribute("aria-valuenow", String(dragged));
    });

    test("Escape during a drag puts the value back and records nothing", async ({
      page,
    }) => {
      const section = page.getByTestId("gesture");
      const { handle, x, y } = await thumb(page);
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let i = 1; i <= 10; i++) await page.mouse.move(x + i * 6, y);
      expect(
        Number(await handle.getAttribute("aria-valuenow")),
      ).toBeGreaterThan(40);
      await page.keyboard.press("Escape");
      await expect(handle).toHaveAttribute("aria-valuenow", "40");
      await page.mouse.up();
      await expect(
        section.getByRole("button", { name: "Undo" }),
      ).toBeDisabled();
      await expect(
        section.getByRole("button", { name: "Redo" }),
      ).toBeDisabled();
    });

    test("keyboard steps on the slider fold into one step", async ({
      page,
    }) => {
      const section = page.getByTestId("gesture");
      const { handle } = await thumb(page);
      await handle.focus();
      for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
      await expect(handle).toHaveAttribute("aria-valuenow", "45");
      await page.keyboard.press("ControlOrMeta+z");
      await expect(handle).toHaveAttribute("aria-valuenow", "40");
      await expect(
        section.getByRole("button", { name: "Undo" }),
      ).toBeDisabled();
    });
  });

  test.describe("appearance", () => {
    for (const theme of ["white", "g100"]) {
      test(`has no accessibility violations on ${theme}`, async ({ page }) => {
        await page.evaluate(
          (value) => document.documentElement.setAttribute("theme", value),
          theme,
        );
        // Let the colors finish their transition before axe reads them.
        await page.waitForTimeout(400);
        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }

    test("has no accessibility violations in RTL", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      try {
        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();
        expect(results.violations).toEqual([]);
      } finally {
        await page.evaluate(() =>
          document.documentElement.removeAttribute("dir"),
        );
      }
    });

    test("keeps the Undo button outlined in forced colors", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      try {
        await page
          .getByTestId("commands")
          .getByRole("button", { name: "Delete Ada Lovelace", exact: true })
          .click();
        const undo = page
          .getByTestId("commands")
          .getByRole("button", { name: /^Undo/ });
        await undo.focus();
        const outline = await undo.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            border: style.borderTopWidth,
            outline: style.outlineStyle,
            shadow: style.boxShadow,
          };
        });
        expect(
          outline.border !== "0px" ||
            outline.outline !== "none" ||
            outline.shadow !== "none",
        ).toBe(true);
      } finally {
        await page.emulateMedia({ forcedColors: "none" });
      }
    });
  });
});
