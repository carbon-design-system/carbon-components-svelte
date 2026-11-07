import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const subnet = (page: Page) =>
  page.getByRole("textbox", { name: "Subnet", exact: true });
const ipv6 = (page: Page) =>
  page.getByRole("textbox", { name: "IPv6 address", exact: true });
const sources = (page: Page) =>
  page.getByRole("textbox", { name: "Sources", exact: true });

test.describe("IPAddressInput a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ip-address-input.html");
    await expect(subnet(page)).toBeVisible();
  });

  for (const theme of ["white", "g100"]) {
    for (const dir of ["ltr", "rtl"]) {
      test(`has no detectable accessibility violations (${theme}, ${dir})`, async ({
        page,
      }) => {
        await page.evaluate(
          ([theme, dir]) => {
            document.documentElement.setAttribute("theme", theme);
            document.documentElement.dir = dir;
          },
          [theme, dir],
        );
        // The theme change runs the fields' color transitions; axe reads
        // the colors mid-way otherwise.
        await page.waitForFunction(() => document.getAnimations().length === 0);
        // A disabled field is exempt from the contrast rules (WCAG 1.4.3).
        const results = await new AxeBuilder({ page })
          .include("#app")
          .exclude("[data-testid=disabled]")
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }

  test("points the field at its preview, and the preview names the block", async ({
    page,
  }) => {
    const preview = page.locator(
      "[data-testid=cidr] .bx--ip-address-input__preview",
    );
    await expect(preview).toContainText("256 addresses");
    await expect(preview).toContainText("10.0.0.0");
    await expect(preview).toContainText("10.0.0.255");
    const describedBy = await subnet(page).getAttribute("aria-describedby");
    expect(describedBy).toContain((await preview.getAttribute("id")) ?? "");
  });

  test("normalizes on Enter and on Tab from the keyboard alone", async ({
    page,
  }) => {
    await ipv6(page).fill("");
    await page.keyboard.type("2001:0DB8:0:0:0:0:0:0001");
    await page.keyboard.press("Enter");
    await expect(ipv6(page)).toHaveValue("2001:db8::1");

    await ipv6(page).fill("");
    await page.keyboard.type("0:0:0:0:0:0:0:1");
    await page.keyboard.press("Tab");
    await expect(ipv6(page)).toHaveValue("::1");
  });

  test("announces an error through the invalid pattern after the text is committed", async ({
    page,
  }) => {
    const input = subnet(page);
    await input.focus();
    await input.fill("10.0.1.77/24");
    // Nothing yet while the person is still in the field.
    await expect(input).not.toHaveAttribute("aria-invalid", "true");

    await page.keyboard.press("Tab");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    const message = page.locator("[data-testid=cidr] .bx--form-requirement");
    await expect(message).toHaveText(
      "Host bits set: did you mean 10.0.1.0/24?",
    );
    await expect(message).toHaveAttribute("role", "alert");
    await expect(input).toHaveAttribute(
      "aria-errormessage",
      (await message.getAttribute("id")) ?? "",
    );

    // Fixing it clears the error as it is typed.
    await input.fill("10.0.1.0/24");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  test("holds a block outside the VPC to within", async ({ page }) => {
    await subnet(page).fill("10.9.0.0/24");
    await page.keyboard.press("Enter");
    await expect(
      page.locator("[data-testid=cidr] .bx--form-requirement"),
    ).toHaveText("Must be inside 10.0.0.0/16");
    // The preview is still there, to show what was typed.
    await expect(
      page.locator("[data-testid=cidr] .bx--ip-address-input__preview"),
    ).toContainText("256 addresses");
  });

  test("keeps the page responsive for a 10,000 character paste", async ({
    page,
  }) => {
    const input = ipv6(page);
    await input.focus();
    const start = Date.now();
    await input.fill(":".repeat(10_000));
    await page.keyboard.press("Tab");
    await expect(
      page.locator("[data-testid=ipv6] .bx--form-requirement"),
    ).toHaveText("Too long: at most 512 characters");
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test("adds, reaches and removes entries of the list from the keyboard", async ({
    page,
  }) => {
    const input = sources(page);
    const value = page.getByTestId("list-value");

    await input.focus();
    await page.keyboard.type("10.0.0.0/8");
    await page.keyboard.press("Enter");
    await expect(value).toHaveText(
      JSON.stringify(["203.0.113.0/24", "2001:db8::/32", "10.0.0.0/8"]),
    );

    // A rejected entry stays, with its message.
    await page.keyboard.type("10.0.0.5/8");
    await page.keyboard.press("Enter");
    await expect(
      page.locator("[data-testid=list] .bx--form-requirement"),
    ).toHaveText("Host bits set: did you mean 10.0.0.0/8?");
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.press("Backspace");

    await page.keyboard.press("Backspace");
    await expect(
      page.getByRole("button", { name: "Remove 10.0.0.0/8" }),
    ).toBeFocused();
    await page.keyboard.press("Delete");
    await expect(value).toHaveText(
      JSON.stringify(["203.0.113.0/24", "2001:db8::/32"]),
    );
  });

  test("takes a pasted list of 100 CIDR blocks", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "firefox",
      "Firefox ignores clipboardData in a constructed ClipboardEvent",
    );
    const blocks = Array.from(
      { length: 100 },
      (_, i) => `172.${16 + (i >> 4)}.${(i & 15) * 16}.0/20`,
    );
    const start = Date.now();
    await sources(page).evaluate((input, text) => {
      const data = new DataTransfer();
      data.setData("text", text);
      input.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, blocks.join("\n"));
    await expect(
      page.locator("[data-testid=list] .bx--tag__close-icon"),
    ).toHaveCount(102);
    expect(Date.now() - start).toBeLessThan(5000);
    await expect(sources(page)).toHaveValue("");
  });
});

test.describe("IPAddressInput in a right-to-left page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ip-address-input.html");
    await expect(subnet(page)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
  });

  test("keeps the address left to right", async ({ page }) => {
    // `::1` mixes colons and a digit, which a right-to-left direction
    // would show as `1::`. The field sets its own direction, and no
    // `unicode-bidi: plaintext` takes it back to the page's.
    for (const field of ["ipv6", "cidr"]) {
      const style = await page
        .getByTestId(field)
        .locator("input")
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return { direction: s.direction, bidi: s.unicodeBidi };
        });
      expect(style).toEqual({ direction: "ltr", bidi: "normal" });
    }
    // The label stays in the page's direction.
    expect(
      await page
        .getByTestId("ipv6")
        .locator("label")
        .evaluate((el) => getComputedStyle(el).direction),
    ).toBe("rtl");
  });

  test("puts the status icon at the page's inline end and reserves room for it", async ({
    page,
  }) => {
    const field = page.getByTestId("invalid");
    const input = field.locator("input");
    const icon = field.locator(".bx--text-input__invalid-icon");
    const inputBox = await input.boundingBox();
    const iconBox = await icon.boundingBox();
    if (!(inputBox && iconBox)) throw new Error("not rendered");

    // The icon is at the left in a right-to-left page.
    expect(iconBox.x - inputBox.x).toBeLessThan(inputBox.width / 4);
    const padding = await input.evaluate((el) => ({
      left: Number.parseFloat(getComputedStyle(el).paddingLeft),
      right: Number.parseFloat(getComputedStyle(el).paddingRight),
    }));
    // The text starts after the icon.
    expect(inputBox.x + padding.left).toBeGreaterThanOrEqual(
      iconBox.x + iconBox.width - 1,
    );
    expect(padding.right).toBeLessThanOrEqual(16);
  });

  test("shows each list entry left to right", async ({ page }) => {
    const label = page.locator("[data-testid=list] .bx--tag bdi").first();
    await expect(label).toHaveAttribute("dir", "ltr");
    expect(await label.evaluate((el) => getComputedStyle(el).direction)).toBe(
      "ltr",
    );
  });
});

test.describe("IPAddressInput under forced colors", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/ip-address-input.html");
    await expect(subnet(page)).toBeVisible();
  });

  test("shows a focus ring on the field", async ({ page }) => {
    await subnet(page).focus();
    const outline = await subnet(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).toBe("solid");
    expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });

  test("keeps the error, the preview and the field border visible", async ({
    page,
  }) => {
    const invalid = page.getByTestId("invalid");
    // The invalid field keeps an outline, and its message is text, not color.
    const outline = await invalid
      .locator("input")
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
    await expect(invalid.locator(".bx--form-requirement")).toHaveText(
      "Octet 4 is greater than 255",
    );
    await expect(
      invalid.locator(".bx--text-input__invalid-icon"),
    ).toBeVisible();

    const preview = page.locator(
      "[data-testid=cidr] .bx--ip-address-input__preview",
    );
    const color = await preview.evaluate((el) => getComputedStyle(el).color);
    const canvas = await preview.evaluate(
      (el) => getComputedStyle(el.closest("body") ?? el).backgroundColor,
    );
    expect(color).not.toBe(canvas);
  });
});
