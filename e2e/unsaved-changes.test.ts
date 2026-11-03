import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const DIRTY = /^dirty/;
const CLEAN = /^clean/;

function pick(page: Page, scope: Locator, option: string) {
  return async () => {
    await scope.getByRole("combobox").click();
    await page.getByRole("option").filter({ hasText: option }).click();
  };
}

type Change = {
  name: string;
  scope: (page: Page) => Locator;
  /** Move the control away from its baseline. */
  change: (page: Page, scope: Locator) => Promise<void>;
  /** Put it back, so the form reads clean again. */
  revert: (page: Page, scope: Locator) => Promise<void>;
};

const controls: Change[] = [
  {
    name: "TextInput",
    scope: (page) => page.getByTestId("text-input"),
    change: (_, scope) => scope.getByRole("textbox").fill("Ada!"),
    revert: (_, scope) => scope.getByRole("textbox").fill("Ada"),
  },
  {
    name: "TextArea",
    scope: (page) => page.getByTestId("text-area"),
    change: (_, scope) => scope.getByRole("textbox").fill("Hello!"),
    revert: (_, scope) => scope.getByRole("textbox").fill("Hello"),
  },
  {
    name: "NumberInput (stepper)",
    scope: (page) => page.getByTestId("number-input"),
    change: (_, scope) =>
      scope.getByRole("button", { name: "Increment number" }).click(),
    revert: (_, scope) =>
      scope.getByRole("button", { name: "Decrement number" }).click(),
  },
  {
    name: "NumberInput (typing)",
    scope: (page) => page.getByTestId("number-input"),
    change: (_, scope) => scope.getByRole("spinbutton").fill("9"),
    revert: (_, scope) => scope.getByRole("spinbutton").fill("2"),
  },
  {
    name: "Select",
    scope: (page) => page.getByTestId("select"),
    change: (_, scope) => scope.getByRole("combobox").selectOption("two"),
    revert: (_, scope) => scope.getByRole("combobox").selectOption("one"),
  },
  {
    name: "ComboBox",
    scope: (page) => page.getByTestId("combo-box"),
    change: (page, scope) => pick(page, scope, "Beta")(),
    revert: (page, scope) => pick(page, scope, "Alpha")(),
  },
  {
    name: "Dropdown with a name",
    scope: (page) => page.getByTestId("dropdown-named"),
    change: (page, scope) => pick(page, scope.locator("div").first(), "Beta")(),
    revert: (page, scope) =>
      pick(page, scope.locator("div").first(), "Alpha")(),
  },
  {
    name: "Dropdown without a name (explicit mode)",
    scope: (page) => page.getByTestId("dropdown"),
    change: (page, scope) => pick(page, scope.locator("div").first(), "Beta")(),
    revert: (page, scope) =>
      pick(page, scope.locator("div").first(), "Alpha")(),
  },
  {
    name: "MultiSelect",
    scope: (page) => page.getByTestId("multi-select"),
    change: (page, scope) => pick(page, scope, "Beta")(),
    // The menu stays open after a pick.
    revert: (page) =>
      page.getByRole("option").filter({ hasText: "Beta" }).click(),
  },
  {
    name: "Checkbox",
    scope: (page) => page.getByTestId("checkbox"),
    change: (_, scope) => scope.getByText("Agree").click(),
    revert: (_, scope) => scope.getByText("Agree").click(),
  },
  {
    name: "RadioButtonGroup",
    scope: (page) => page.getByTestId("radio"),
    change: (_, scope) => scope.getByText("Pro", { exact: true }).click(),
    revert: (_, scope) => scope.getByText("Free", { exact: true }).click(),
  },
  {
    name: "Toggle",
    scope: (page) => page.getByTestId("toggle"),
    change: (_, scope) => scope.locator("label").click(),
    revert: (_, scope) => scope.locator("label").click(),
  },
  {
    name: "Slider (keyboard)",
    scope: (page) => page.getByTestId("slider"),
    change: (_, scope) => scope.getByRole("slider").press("ArrowRight"),
    revert: (_, scope) => scope.getByRole("slider").press("ArrowLeft"),
  },
  {
    name: "Slider (text input)",
    scope: (page) => page.getByTestId("slider"),
    change: async (_, scope) => {
      const input = scope.getByRole("spinbutton");
      await input.fill("55");
      await input.press("Tab");
    },
    revert: async (_, scope) => {
      const input = scope.getByRole("spinbutton");
      await input.fill("20");
      await input.press("Tab");
    },
  },
  {
    name: "DatePicker (typing)",
    scope: (page) => page.getByTestId("date-picker"),
    change: async (_, scope) => {
      const input = scope.getByRole("textbox");
      await input.fill("03/20/2024");
      await input.press("Enter");
    },
    revert: async (_, scope) => {
      const input = scope.getByRole("textbox");
      await input.fill("03/15/2024");
      await input.press("Enter");
    },
  },
  {
    name: "DatePicker (calendar)",
    scope: (page) => page.getByTestId("date-picker"),
    change: async (page, scope) => {
      await scope.getByRole("textbox").click();
      await page
        .getByRole("gridcell", { name: "Wednesday, March 20, 2024" })
        .click();
    },
    revert: async (page, scope) => {
      await scope.getByRole("textbox").click();
      await page
        .getByRole("gridcell", { name: "Friday, March 15, 2024" })
        .click();
    },
  },
  {
    name: "FileUploader",
    scope: (page) => page.getByTestId("file-uploader"),
    change: (_, scope) =>
      scope.locator('input[type="file"]').setInputFiles({
        name: "a.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("a"),
      }),
    revert: (_, scope) =>
      scope.getByRole("button", { name: "Remove file" }).click(),
  },
  {
    name: "FileUploaderDropContainer",
    scope: (page) => page.getByTestId("drop-container"),
    change: (_, scope) =>
      scope.locator('input[type="file"]').setInputFiles({
        name: "a.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("a"),
      }),
    revert: (_, scope) => scope.locator('input[type="file"]').setInputFiles([]),
  },
];

test.describe("trackUnsavedChanges", () => {
  for (const fluid of [false, true]) {
    test.describe(fluid ? "fluid form" : "form", () => {
      test.beforeEach(async ({ page }) => {
        if (fluid) await page.goto("/unsaved-changes.html?fluid");
        else await page.goto("/unsaved-changes.html");
        await expect(page.getByTestId("status")).toHaveText(CLEAN);
      });

      for (const control of controls) {
        test(`${control.name} reads dirty, then clean again`, async ({
          page,
        }) => {
          const scope = control.scope(page);
          const status = page.getByTestId("status");

          await control.change(page, scope);
          await expect(status).toHaveText(DIRTY);

          await control.revert(page, scope);
          await expect(status).toHaveText(CLEAN);
        });
      }
    });
  }
});

test.describe("saving, resetting and leaving", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/unsaved-changes.html");
    await expect(page.getByTestId("status")).toHaveText(CLEAN);
  });

  test("a failed save keeps the guard armed and a good save disarms it", async ({
    page,
  }) => {
    const status = page.getByTestId("status");
    await page.getByTestId("text-input").getByRole("textbox").fill("Ada!");
    await expect(status).toHaveText(DIRTY);

    await page.getByRole("button", { name: "Save (fails)" }).click();
    await expect(status).toHaveText(DIRTY);

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(status).toHaveText(CLEAN);

    // The saved value is the new baseline.
    await page.getByTestId("text-input").getByRole("textbox").fill("Ada");
    await expect(status).toHaveText(DIRTY);
  });

  test("a reset button returns the form to clean", async ({ page }) => {
    const status = page.getByTestId("status");
    await page.getByTestId("text-input").getByRole("textbox").fill("Ada!");
    await page.getByTestId("checkbox").getByText("Agree").click();
    await page.getByTestId("select").getByRole("combobox").selectOption("two");
    await expect(status).toHaveText(DIRTY);

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(status).toHaveText(CLEAN);
  });

  test("ComboBox picked with the keyboard reads dirty", async ({ page }) => {
    const combo = page.getByTestId("combo-box").getByRole("combobox");
    await combo.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("status")).toHaveText(DIRTY);
  });

  test("the browser asks before it leaves a dirty page", async ({ page }) => {
    await page.getByTestId("text-input").getByRole("textbox").fill("Ada!");
    await page.getByTestId("checkbox").getByText("Agree").click();
    await expect(page.getByTestId("status")).toHaveText(DIRTY);

    const dialog = page.waitForEvent("dialog");
    await page.evaluate(() => {
      setTimeout(() => {
        location.href = "about:blank";
      });
    });
    const prompt = await dialog;
    expect(prompt.type()).toBe("beforeunload");
    await prompt.dismiss();

    await expect(page.getByTestId("status")).toHaveText(DIRTY);
  });
});

test.describe("native submit", () => {
  test("navigates without the browser prompt", async ({ page }) => {
    await page.route("**/unsaved-changes-target", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>Saved</p>" }),
    );
    await page.goto("/unsaved-changes.html?native");
    await page.getByTestId("text-input").getByRole("textbox").fill("Ada!");
    await expect(page.getByTestId("status")).toHaveText(DIRTY);

    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Saved")).toBeVisible();
    expect(dialogs).toEqual([]);

    // Leave the shared host page where the next test expects to find it.
    page.removeAllListeners("dialog");
    await page.goto("/host.html");
  });
});
