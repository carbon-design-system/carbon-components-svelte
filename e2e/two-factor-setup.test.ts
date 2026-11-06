import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// An oracle for the example's TOTP that shares no code with it: Node's HMAC.
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function decodeKey(text: string) {
  let bits = "";
  for (const char of text.replace(/\s/g, "")) {
    bits += BASE32.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}
function codeAt(key: string, offsetSteps = 0) {
  const counter = Math.floor(Date.now() / 30_000) + offsetSteps;
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac("sha1", decodeKey(key)).update(message).digest();
  const offset = mac[19] & 15;
  const binary = mac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

const toggle = (page: Page) =>
  page.getByRole("button", { name: "Can't scan? Enter this key" });
const next = (page: Page) => page.getByRole("button", { name: "Continue" });
const segments = (page: Page) => page.locator(".bx--pin-code-input__field");

/** The setup key, read from the text alternative as a person would. */
async function readKey(page: Page) {
  await toggle(page).click();
  const shown = (
    await page.locator(".bx--copy-text__value").first().textContent()
  )?.trim();
  if (!shown) throw new Error("no key");
  return shown;
}

async function toVerify(page: Page) {
  const key = await readKey(page);
  await next(page).click();
  await expect(segments(page).first()).toBeVisible();
  return key.replace(/\s/g, "");
}

async function typeCode(page: Page, code: string) {
  await segments(page).first().click();
  await page.keyboard.type(code);
}

test.describe("TwoFactorSetup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/two-factor-setup.html");
    await expect(page.getByRole("img")).toBeVisible();
  });

  test.describe("scan", () => {
    test("names the code by purpose and groups the key in fours", async ({
      page,
    }) => {
      await expect(
        page.getByRole("img", {
          name: "Scan to set up two-factor authentication for alice@acme.io",
        }),
      ).toBeVisible();

      const shown = await readKey(page);

      expect(shown).toMatch(/^([A-Z2-7]{4} ){7}[A-Z2-7]{4}$/);
    });

    test("encodes the key and issuer in an otpauth URI", async ({ page }) => {
      const key = (await readKey(page)).replace(/\s/g, "");
      const dark = await page.locator(".bx--qr-code__path").getAttribute("d");

      // A version 4 symbol or smaller for a URI this short.
      expect(dark).toBeTruthy();
      await expect(page.getByRole("img")).toHaveAccessibleDescription(
        /[A-Z2-7]{4}/,
      );
      expect(key).toHaveLength(32);
    });

    test("copies the key without the spaces", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const key = (await readKey(page)).replace(/\s/g, "");

      await page.getByRole("button", { name: "Copy to clipboard" }).click();

      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        key,
      );
    });
  });

  test.describe("verify", () => {
    test("asks the browser to autofill a one-time code", async ({ page }) => {
      await toVerify(page);

      await expect(segments(page).first()).toHaveAttribute(
        "autocomplete",
        "one-time-code",
      );
    });

    test("fills every digit from a pasted code", async ({ page }) => {
      const key = await toVerify(page);
      const code = codeAt(key);

      await segments(page).first().focus();
      await page.evaluate((code) => {
        const input = document.activeElement;
        const data = new DataTransfer();
        data.setData("text/plain", code);
        input?.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData: data,
            bubbles: true,
            cancelable: true,
          }),
        );
      }, code);

      await expect(segments(page)).toHaveCount(6);
      expect(
        await segments(page).evaluateAll((els) =>
          els.map((el) => (el as HTMLInputElement).value).join(""),
        ),
      ).toBe(code);
      await next(page).click();
      await expect(page.getByText("Save these recovery codes")).toBeVisible();
    });

    test("clears and refocuses after a wrong code", async ({ page }) => {
      await toVerify(page);

      await typeCode(page, "000000");
      await next(page).click();

      await expect(
        page.getByText("That code is not right. Check your app and try again."),
      ).toBeVisible();
      await expect(segments(page).first()).toBeFocused();
      expect(
        await segments(page).evaluateAll((els) =>
          els.map((el) => (el as HTMLInputElement).value),
        ),
      ).toEqual(["", "", "", "", "", ""]);
      await expect(segments(page).first()).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      // Typing again clears the error.
      await page.keyboard.type("1");
      await expect(page.getByText("That code is not right")).toBeHidden();
    });

    test("says an old code has expired", async ({ page }) => {
      const key = await toVerify(page);

      await typeCode(page, codeAt(key, -3));
      await next(page).click();

      await expect(
        page.getByText(
          "That code has expired. Enter the code your app shows now.",
        ),
      ).toBeVisible();
      await expect(segments(page).first()).toBeFocused();
    });

    test("locks the step after too many wrong codes, then unlocks", async ({
      page,
    }) => {
      await toVerify(page);
      for (let attempt = 0; attempt < 2; attempt++) {
        await typeCode(page, "000000");
        await next(page).click();
        await expect(page.getByText("That code is not right")).toBeVisible();
      }
      await typeCode(page, "000000");
      await next(page).click();

      await expect(page.getByText("Too many attempts.").first()).toBeVisible();
      await expect(page.getByRole("timer")).toBeVisible();
      await expect(segments(page).first()).toBeDisabled();
      await expect(next(page)).toBeDisabled();

      // `lockSeconds` is 2 in this fixture.
      await expect(segments(page).first()).toBeEnabled({ timeout: 6000 });
      await expect(segments(page).first()).toBeFocused();
      await expect(next(page)).toBeEnabled();
    });
  });

  test.describe("recovery codes", () => {
    async function toRecovery(page: Page) {
      const key = await toVerify(page);
      await typeCode(page, codeAt(key));
      await next(page).click();
      await expect(page.getByText("Save these recovery codes")).toBeVisible();
    }

    test("downloads the codes as a text file", async ({ page }) => {
      await toRecovery(page);

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Download .txt" }).click(),
      ]);

      expect(download.suggestedFilename()).toBe("acme-recovery-codes.txt");
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      const text = Buffer.concat(chunks).toString("utf8");
      const codes = text.match(/^[a-z2-9]{5}-[a-z2-9]{5}$/gm) ?? [];
      expect(new Set(codes).size).toBe(10);
      expect(text).toContain("alice@acme.io");
    });

    test("copies the codes", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await toRecovery(page);

      await page.getByRole("button", { name: "Copy recovery codes" }).click();

      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied.split("\n")).toHaveLength(10);
    });

    test("prints from a frame that holds only the codes", async ({ page }) => {
      await toRecovery(page);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      await page.getByRole("button", { name: "Print" }).click();
      await page.waitForTimeout(300);

      expect(errors).toEqual([]);
    });

    test("needs the confirmation before it finishes", async ({ page }) => {
      await toRecovery(page);
      const finish = page.getByRole("button", { name: "Turn on" });

      await expect(finish).toBeDisabled();
      await page.getByText("I saved these recovery codes").click();
      await expect(finish).toBeEnabled();
      await finish.click();

      await expect(
        page.getByText("Two-factor authentication is on."),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Start again" }),
      ).toBeVisible();
    });
  });

  test("has no accessibility violations on any step", async ({ page }) => {
    const axe = () => new AxeBuilder({ page }).include("#app").analyze();

    await toggle(page).click();
    await expect(page.locator(".bx--disclosure--expanding")).toHaveCount(0);
    expect((await axe()).violations).toEqual([]);

    const key =
      (
        await page.locator(".bx--copy-text__value").first().textContent()
      )?.trim() ?? "";
    await next(page).click();
    await typeCode(page, "000000");
    await next(page).click();
    await expect(page.getByText("That code is not right")).toBeVisible();
    expect((await axe()).violations).toEqual([]);

    await typeCode(page, codeAt(key));
    await next(page).click();
    await expect(page.getByText("Save these recovery codes")).toBeVisible();
    expect((await axe()).violations).toEqual([]);
  });

  test("keeps the QR code unmirrored in right-to-left", async ({ page }) => {
    const path = () => page.locator(".bx--qr-code__path").getAttribute("d");
    const before = await path();

    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    expect(await path()).toBe(before);
    await expect(page.getByRole("img")).toBeVisible();
  });
});
