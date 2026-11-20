import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page) => page.getByRole("textbox", { name: "Message" });
const log = (page: Page) => page.getByTestId("log");
const root = (page: Page) => page.locator(".bx--prompt-input");
const chips = (page: Page) => page.locator(".bx--prompt-input__chip-name");

/** Dispatches an event carrying a file, as a paste or a drop does. */
function sendFile(target: Locator, type: "paste" | "drop" | "dragenter") {
  return target.evaluate((node, type) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(["x"], "screenshot.png", {
        type: "image/png",
        lastModified: 1_700_000_000_000,
      }),
    );
    const event =
      type === "paste"
        ? new ClipboardEvent("paste", {
            clipboardData: transfer,
            bubbles: true,
            cancelable: true,
          })
        : new DragEvent(type, {
            dataTransfer: transfer,
            bubbles: true,
            cancelable: true,
          });
    node.dispatchEvent(event);
  }, type);
}

test.describe("PromptInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prompt-input.html");
    await expect(field(page)).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    await sendFile(field(page), "paste");
    await expect(chips(page)).toHaveText("screenshot.png");
    await page.getByTestId("stream").click();
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    // Colors fade between themes, and axe would read them mid-way.
    await page.waitForTimeout(400);
    const g100 = await new AxeBuilder({ page }).include("#app").analyze();
    expect(g100.violations).toEqual([]);
  });

  test("sends on Enter and starts a new line on Shift+Enter", async ({
    page,
  }) => {
    await field(page).click();
    await page.keyboard.type("Why is billing-api slow?");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("Check the p95.");
    await expect(field(page)).toHaveValue(
      "Why is billing-api slow?\nCheck the p95.",
    );

    await page.keyboard.press("Enter");

    await expect(log(page)).toHaveText(
      "submit:Why is billing-api slow?\nCheck the p95.:",
    );
    await expect(field(page)).toHaveValue("");
    await expect(field(page)).toBeFocused();
  });

  test("doesn't send the Enter that confirms an IME composition", async ({
    page,
  }) => {
    const client = await page.context().newCDPSession(page);
    await field(page).click();

    await client.send("Input.imeSetComposition", {
      text: "にほんご",
      selectionStart: 4,
      selectionEnd: 4,
    });
    await page.keyboard.press("Enter");
    await expect(log(page)).toHaveText("");

    // Committing is the IME's, so settle the text and send it.
    await field(page).fill("日本語");
    await page.keyboard.press("Enter");
    await expect(log(page)).toHaveText("submit:日本語:");
  });

  test("grows with its text up to maxRows, then scrolls", async ({ page }) => {
    const height = () =>
      field(page).evaluate((node) => node.getBoundingClientRect().height);
    const one = await height();

    await field(page).click();
    await field(page).fill("1\n2\n3\n4");
    await expect.poll(height).toBeGreaterThan(one * 1.8);
    const four = await height();
    await field(page).fill(Array.from({ length: 24 }, (_, i) => i).join("\n"));
    await page.waitForTimeout(200);
    const capped = await height();

    expect(capped).toBeLessThan(four * 3);
    expect(
      await field(page).evaluate(
        (node) => node.scrollHeight > node.clientHeight,
      ),
    ).toBe(true);
  });

  test("attaches a pasted image and a dropped file, and removes one", async ({
    page,
  }) => {
    await sendFile(field(page), "paste");
    await expect(log(page)).toHaveText("attach:screenshot.png");

    await sendFile(root(page), "dragenter");
    await expect(root(page)).toHaveClass(/bx--prompt-input--dragging/);
    await expect(page.getByText("Drop files to attach")).toBeVisible();
    await sendFile(root(page), "drop");
    await expect(chips(page)).toHaveCount(1);
    await expect(log(page)).toContainText("reject:screenshot.png:duplicate");

    await page.getByRole("button", { name: "Remove screenshot.png" }).click();
    await expect(chips(page)).toHaveCount(0);
    await expect(field(page)).toBeFocused();
  });

  test("recalls earlier prompts with the arrow keys, and stops with Escape", async ({
    page,
  }) => {
    await field(page).click();
    await page.keyboard.press("ArrowUp");
    await expect(field(page)).toHaveValue("Draft a status page update");
    await page.keyboard.press("ArrowUp");
    await expect(field(page)).toHaveValue("Summarize the incident report");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(field(page)).toHaveValue("");

    await page.getByTestId("stream").click();
    await field(page).click();
    await page.keyboard.press("Escape");
    await expect(log(page)).toHaveText("stop");
  });

  test("reaches every control with the keyboard, in reading order", async ({
    page,
  }) => {
    await field(page).click();
    await page.keyboard.type("Hello");

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Attach files" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Model: Granite 4" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Send" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(log(page)).toHaveText("submit:Hello:");
  });

  test("holds the ring and the edge of the composer in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const style = () =>
      root(page).evaluate((node) => {
        const s = getComputedStyle(node);
        return { width: s.outlineWidth, style: s.outlineStyle };
      });

    expect(await style()).toEqual({ width: "1px", style: "solid" });
    await field(page).focus();
    expect(await style()).toEqual({ width: "2px", style: "solid" });
  });

  test("puts the send button at the inline end, in either direction", async ({
    page,
  }) => {
    const sides = () =>
      page.evaluate(() => {
        const box = (selector: string) =>
          document.querySelector(selector)?.getBoundingClientRect() as DOMRect;
        const composer = box(".bx--prompt-input");
        const attach = box(".bx--prompt-input__tools .bx--btn");
        const send = box(".bx--prompt-input__end .bx--btn");
        return {
          attachNearLeft:
            attach.left - composer.left < composer.right - attach.right,
          sendNearLeft: send.left - composer.left < composer.right - send.right,
        };
      });

    expect(await sides()).toEqual({
      attachNearLeft: true,
      sendNearLeft: false,
    });
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    expect(await sides()).toEqual({
      attachNearLeft: false,
      sendNearLeft: true,
    });
  });

  test("shows the wait on the stop button, and holds it still for reduced motion", async ({
    page,
  }) => {
    await page.getByTestId("wait").click();
    const stop = page.getByRole("button", { name: "Stop" });
    await expect(stop).toBeEnabled();

    const animation = () =>
      page
        .locator(".bx--prompt-input__send")
        .evaluate((node) => getComputedStyle(node, "::after").animationName);
    expect(await animation()).toBe("prompt-input-spin");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await animation()).toBe("none");
  });
});
