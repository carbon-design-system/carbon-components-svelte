import { expect, type Locator, type Page, test } from "@playwright/test";

function defaultSection(page: Page) {
  return page.getByTestId("pin-code-input-default");
}

function segment(
  section: Locator,
  labelText: string,
  index: number,
  count = 4,
) {
  return section.getByLabel(`${labelText} digit ${index} of ${count}`);
}

async function pasteInto(locator: Locator, text: string) {
  await locator.evaluate((element, value) => {
    const data = new DataTransfer();
    data.setData("text/plain", value);
    element.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true }),
    );
  }, text);
}

test.describe("PinCodeInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pin-code-input.html");
  });

  test("renders four segments with a visible label", async ({ page }) => {
    const section = defaultSection(page);
    await expect(section.getByText("Verification code")).toBeVisible();
    await expect(section.getByRole("textbox")).toHaveCount(4);
  });

  test("can be located by segment aria-label", async ({ page }) => {
    const section = defaultSection(page);
    const first = segment(section, "Verification code", 1);
    await expect(first).toBeVisible();
    await first.fill("7");
    await expect(first).toHaveValue("7");
  });

  test("auto-advances focus while typing", async ({ page }) => {
    const section = defaultSection(page);
    const first = segment(section, "Verification code", 1);
    const second = segment(section, "Verification code", 2);

    await first.click();
    await page.keyboard.type("1");
    await expect(first).toHaveValue("1");
    await expect(second).toBeFocused();
  });

  test("updates bound value and complete state", async ({ page }) => {
    const section = defaultSection(page);
    const first = segment(section, "Verification code", 1);

    await first.click();
    await page.keyboard.type("1234");

    await expect(page.getByTestId("pin-code-input-value")).toHaveText("1234");
    await expect(page.getByTestId("pin-code-input-complete")).toHaveText(
      "true",
    );
  });

  test("moves focus back on Backspace when the segment is empty", async ({
    page,
  }) => {
    const section = defaultSection(page);
    const first = segment(section, "Verification code", 1);
    const second = segment(section, "Verification code", 2);

    await first.click();
    await page.keyboard.type("1");
    await expect(second).toBeFocused();
    await page.keyboard.press("Backspace");

    await expect(first).toBeFocused();
    await expect(first).toHaveValue("");
  });

  test("distributes a pasted code across segments", async ({ page }) => {
    const section = defaultSection(page);
    const first = segment(section, "Verification code", 1);
    const fourth = segment(section, "Verification code", 4);

    await first.focus();
    await pasteInto(first, "4321");

    await expect(fourth).toHaveValue("1");
    await expect(page.getByTestId("pin-code-input-value")).toHaveText("4321");
    await expect(fourth).toBeFocused();
  });

  test("accepts alphanumeric characters", async ({ page }) => {
    const section = page.getByTestId("pin-code-input-alphanumeric");
    const first = segment(section, "Invite code", 1);

    await first.click();
    await page.keyboard.type("a1");

    await expect(
      page.getByTestId("pin-code-input-alphanumeric-value"),
    ).toHaveText("a1");
  });

  test("shows invalid state text", async ({ page }) => {
    const section = page.getByTestId("pin-code-input-invalid");
    const message = section.getByText("Incorrect code");

    await expect(message).toBeVisible();
    await expect(message).toHaveClass(/bx--form-requirement/);
    await expect(segment(section, "Verification code", 1)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("disables every segment", async ({ page }) => {
    const section = page.getByTestId("pin-code-input-disabled");
    const inputs = section.getByRole("textbox");

    await expect(inputs).toHaveCount(4);
    await Promise.all(
      (await inputs.all()).map((input) => expect(input).toBeDisabled()),
    );
  });

  test("does not allow edits in the read-only state", async ({ page }) => {
    const section = page.getByTestId("pin-code-input-readonly");
    const first = segment(section, "Verification code", 1);

    await expect(first).toHaveAttribute("readonly", "");
    await first.click({ force: true });
    await page.keyboard.type("9");
    await expect(first).toHaveValue("0");
  });

  test("clears segments programmatically", async ({ page }) => {
    const section = page.getByTestId("pin-code-input-programmatic");

    await expect(
      page.getByTestId("pin-code-input-programmatic-value"),
    ).toHaveText("018");
    await section.getByTestId("pin-code-input-clear").click();
    await expect(
      page.getByTestId("pin-code-input-programmatic-value"),
    ).toHaveText("");
    await expect(segment(section, "Verification code", 1)).toHaveValue("");
  });
});
