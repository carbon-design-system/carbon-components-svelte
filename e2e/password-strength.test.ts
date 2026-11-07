import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const PAUSE = 1200;

function password(page: Page) {
  return page.getByTestId("password");
}

test.describe("PasswordStrength and PasswordRequirements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/password-strength.html");
    await expect(page.getByTestId("password")).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const empty = await new AxeBuilder({ page }).include("#app").analyze();
    expect(empty.violations).toEqual([]);

    await password(page).fill("hunter2");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    const invalid = await new AxeBuilder({ page }).include("#app").analyze();
    expect(invalid.violations).toEqual([]);

    await password(page).fill("lavender-sofa-7!");
    const valid = await new AxeBuilder({ page }).include("#app").analyze();
    expect(valid.violations).toEqual([]);
  });

  test("works from the keyboard alone", async ({ page }) => {
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await expect(password(page)).toBeFocused();

    await page.keyboard.type("lavender-sofa-7!");
    // The meter and the checklist are not tab stops: Tab goes on to the
    // confirm field (through the show/hide button, except in WebKit).
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () =>
          !!document.activeElement?.closest(
            ".bx--password-strength, .bx--password-requirements",
          ),
      );
      expect(inside).toBe(false);
      if (
        await page
          .getByTestId("confirm")
          .evaluate((el) => el === document.activeElement)
      )
        break;
    }
    await expect(page.getByTestId("confirm")).toBeFocused();
    await page.keyboard.type("lavender-sofa-7!");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("created")).toBeVisible();
  });

  test("exposes the meter, the checklist and the description in the accessibility tree", async ({
    page,
  }) => {
    await password(page).fill("hunter2");

    const meter = page.getByRole("meter", { name: "Password strength" });
    await expect(meter).toHaveAttribute("aria-valuetext", "Strength: Weak");
    await expect(meter).toHaveAttribute("aria-valuenow", "1");

    const list = page.getByRole("list", { name: "Password requirements" });
    await expect(list.getByRole("listitem")).toHaveText([
      "At least 12 characters, not met",
      "A number, met",
      "A symbol, not met",
      "No spaces, met",
      "Not a commonly used password, not met",
      "Does not contain your name or email address, met",
    ]);

    const described = await password(page).getAttribute("aria-describedby");
    expect(described).toContain("signup-requirements");
    expect(described).toContain("signup-strength");
    await expect(password(page)).toHaveAccessibleDescription(
      /Password requirements.*At least 12 characters\s*, not met.*Password strength Weak/s,
    );
  });

  test("says the strength once typing pauses, not on every key", async ({
    page,
  }) => {
    const status = page.getByRole("status").first();
    await password(page).pressSequentially("lavender-sofa-7!", { delay: 30 });
    await expect(status).toHaveText("");

    await expect(status).toHaveText("Strength: Good", { timeout: PAUSE * 3 });
  });

  test("says the strength at once on blur", async ({ page }) => {
    await password(page).pressSequentially("lavender-sofa-7!", { delay: 10 });
    await page.getByLabel("Email").focus();
    await expect(page.getByRole("status").first()).toHaveText(
      "Strength: Good",
      { timeout: 500 },
    );
  });

  test("lists the unmet requirements in the error on submit", async ({
    page,
  }) => {
    await password(page).fill("hunter2");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "Password needs: at least 12 characters; a symbol; not a commonly used password",
    );
    await expect(page.getByTestId("created")).toBeHidden();
    await expect(password(page)).toHaveAttribute("aria-invalid", "true");
  });

  test("checks that the confirmation matches", async ({ page }) => {
    await password(page).fill("lavender-sofa-7!");
    const match = page.getByRole("list", { name: "Confirmation" });
    await page.getByTestId("confirm").fill("lavender");
    await expect(match).toHaveText("Passwords match, not met");

    await page.getByTestId("confirm").fill("lavender-sofa-7!");
    await expect(match).toHaveText("Passwords match, met");
  });

  test("a met item and an unmet item differ in shape, not only in color", async ({
    page,
  }) => {
    await password(page).fill("hunter2");
    const list = page.getByRole("list", { name: "Password requirements" });
    const shape = (index: number) =>
      list.getByRole("listitem").nth(index).locator("svg").innerHTML();

    // "A number" is met, "At least 12 characters" is not.
    expect(await shape(1)).not.toBe(await shape(0));
  });

  test("the strength bar fills one more segment per level", async ({
    page,
  }) => {
    const filled = () =>
      page.locator(".bx--password-strength__segment--filled").count();

    await password(page).fill("hunter2");
    expect(await filled()).toBe(1);
    await password(page).fill("j8Kd2nQ9vT5wZ3xB");
    expect(await filled()).toBe(4);
  });

  test.describe("forced colors", () => {
    test.use({ colorScheme: "light" });

    test("filled and empty segments differ without color", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await password(page).fill("j8Kd2nQ9");
      const segments = page.locator(".bx--password-strength__segment");
      // The fill eases in; read it once it has arrived.
      await page
        .locator("#app")
        .evaluate((app) =>
          Promise.all(
            app.getAnimations({ subtree: true }).map((a) => a.finished),
          ),
        );
      const read = (i: number) =>
        segments.nth(i).evaluate((el) => {
          const s = getComputedStyle(el);
          return { background: s.backgroundColor, outline: s.outlineStyle };
        });

      const system = await page.evaluate(() => {
        const probe = document.createElement("div");
        document.body.append(probe);
        const color = (name: string) => {
          probe.style.backgroundColor = name;
          return getComputedStyle(probe).backgroundColor;
        };
        const colors = {
          Highlight: color("Highlight"),
          Canvas: color("Canvas"),
        };
        probe.remove();
        return colors;
      });

      const filled = await read(0);
      const empty = await read(3);
      expect(filled.background).toBe(system.Highlight);
      expect(empty.background).toBe(system.Canvas);
      expect(empty.outline).toBe("solid");
    });
  });

  test.describe("right to left", () => {
    test("the first segment sits on the right and the level word on the left", async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      await password(page).fill("hunter2");

      const first = await page
        .locator(".bx--password-strength__segment")
        .first()
        .boundingBox();
      const last = await page
        .locator(".bx--password-strength__segment")
        .last()
        .boundingBox();
      expect(first!.x).toBeGreaterThan(last!.x);

      const label = await page
        .locator(".bx--password-strength__label-text")
        .boundingBox();
      const level = await page
        .locator(".bx--password-strength__level")
        .boundingBox();
      expect(level!.x).toBeLessThan(label!.x);
    });
  });
});
