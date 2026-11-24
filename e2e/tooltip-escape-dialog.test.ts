import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** `clip` of an inline tooltip's text: `auto` while it shows. */
function inlineClip(trigger: Locator) {
  return trigger.evaluate(
    (element) =>
      getComputedStyle(element.querySelector(".bx--assistive-text") as Element)
        .clip,
  );
}

function portalTooltips(page: Page) {
  return page.locator(".bx--tooltip-portal__content");
}

// A native modal dialog closes on Escape as the key's default action, so a
// tooltip that only stops propagation still lets the dialog close.
test.describe("Tooltips with Escape in a native modal dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-escape-dialog.html");
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog", { name: "Workspace" })).toBeVisible();
  });

  test("Escape hides each focused tooltip before it closes the dialog", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog", { name: "Workspace" });

    const dashboard = page.getByRole("tab", { name: "Dashboard" });
    await dashboard.focus();
    await expect(portalTooltips(page)).toHaveText(["Dashboard"]);

    await page.keyboard.press("Escape");
    await expect(portalTooltips(page)).toHaveCount(0);
    await expect(dashboard).toBeFocused();
    await expect(dialog).toBeVisible();

    const add = page.getByRole("button", { name: "Add item" });
    await page.keyboard.press("Tab");
    await expect(add).toBeFocused();
    await expect.poll(() => inlineClip(add)).toBe("auto");

    await page.keyboard.press("Escape");
    await expect.poll(() => inlineClip(add)).not.toBe("auto");
    await expect(add).toBeFocused();
    await expect(dialog).toBeVisible();

    const edit = page.getByRole("button", { name: "Edit item" });
    await page.keyboard.press("Tab");
    await expect(edit).toBeFocused();
    await expect(portalTooltips(page)).toHaveText(["Edit item"]);

    await page.keyboard.press("Escape");
    await expect(portalTooltips(page)).toHaveCount(0);
    await expect(edit).toBeFocused();
    await expect(dialog).toBeVisible();

    const details = page.getByText("Tooltip details");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Details" })).toBeFocused();
    await expect(details).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await expect(dialog).toBeVisible();

    // With no tooltip left to hide, Escape closes the dialog.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("Escape hides a hovered Tooltip while focus is elsewhere, and leaves the dialog open", async ({
    page,
  }) => {
    const dialog = page.getByRole("dialog", { name: "Workspace" });
    const details = page.getByText("Tooltip details");

    await page.getByRole("button", { name: "Plain button" }).focus();
    await page.getByRole("button", { name: "Details" }).hover();
    await expect(details).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  // Each case opens one popup, which an Escape must hide without also
  // closing the dialog. A second Escape, with nothing left to hide, does.
  const cases: {
    name: string;
    open: (page: Page) => Promise<void>;
    isOpen: (page: Page) => Promise<void>;
    isClosed: (page: Page) => Promise<void>;
  }[] = [
    {
      name: "TooltipIcon",
      open: (page) => page.getByRole("button", { name: "Icon help" }).focus(),
      isOpen: (page) =>
        expect
          .poll(() =>
            inlineClip(page.getByRole("button", { name: "Icon help" })),
          )
          .toBe("auto"),
      isClosed: (page) =>
        expect
          .poll(() =>
            inlineClip(page.getByRole("button", { name: "Icon help" })),
          )
          .not.toBe("auto"),
    },
    {
      name: "TooltipDefinition",
      open: (page) => page.getByRole("button", { name: "Term" }).focus(),
      isOpen: (page) =>
        expect(page.getByRole("button", { name: "Term" })).toHaveAttribute(
          "aria-expanded",
          "true",
        ),
      isClosed: (page) =>
        expect(page.getByRole("button", { name: "Term" })).toHaveAttribute(
          "aria-expanded",
          "false",
        ),
    },
    {
      name: "CopyButton tooltip",
      open: (page) => page.getByRole("button", { name: "Copy link" }).focus(),
      isOpen: (page) => expect(portalTooltips(page)).toHaveText(["Copy link"]),
      isClosed: (page) => expect(portalTooltips(page)).toHaveCount(0),
    },
    {
      name: "CopyButton feedback",
      open: (page) => page.getByRole("button", { name: "Copy link" }).click(),
      isOpen: (page) => expect(portalTooltips(page)).toHaveText(["Copied!"]),
      isClosed: (page) => expect(portalTooltips(page)).toHaveCount(0),
    },
    {
      name: "CodeSnippet feedback",
      open: (page) => page.getByRole("button", { name: "Copy code" }).click(),
      isOpen: (page) => expect(portalTooltips(page)).toHaveText(["Copied!"]),
      isClosed: (page) => expect(portalTooltips(page)).toHaveCount(0),
    },
    {
      name: "Toggletip",
      // From the keyboard: WebKit does not focus a clicked button.
      open: async (page) => {
        await page.getByRole("button", { name: "Show information" }).focus();
        await page.keyboard.press("Enter");
      },
      isOpen: (page) =>
        expect(
          page.getByRole("button", { name: "Show information" }),
        ).toHaveAttribute("aria-expanded", "true"),
      isClosed: (page) =>
        expect(
          page.getByRole("button", { name: "Show information" }),
        ).toHaveAttribute("aria-expanded", "false"),
    },
    {
      name: "OverflowMenu trigger tooltip",
      open: (page) => page.getByRole("button", { name: "Actions" }).focus(),
      isOpen: (page) => expect(portalTooltips(page)).toHaveText(["Actions"]),
      isClosed: (page) => expect(portalTooltips(page)).toHaveCount(0),
    },
  ];

  for (const { name, open, isOpen, isClosed } of cases) {
    test(`Escape hides the ${name} before it closes the dialog`, async ({
      page,
    }) => {
      const dialog = page.getByRole("dialog", { name: "Workspace" });

      await open(page);
      await isOpen(page);

      await page.keyboard.press("Escape");
      await isClosed(page);
      await expect(dialog).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });
  }
});
