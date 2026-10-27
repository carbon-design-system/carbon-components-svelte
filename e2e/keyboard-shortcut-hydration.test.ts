import { expect, test } from "@playwright/test";
import { createServer } from "vite";

// The server can't tell the platform, so it renders Ctrl. On a Mac the first
// client render must agree with that markup, and the keys switch to Command
// after mount. A first render that read the platform would not match the
// server's text.

test("hydrates the server markup on an Apple platform, then shows Command", async ({
  page,
}) => {
  const vite = await createServer({
    configFile: "e2e/vite.config.ts",
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    logLevel: "silent",
  });
  let body: string;
  try {
    const { render } = await vite.ssrLoadModule("svelte/server");
    const { default: Fixture } = await vite.ssrLoadModule(
      "/KeyboardShortcutHydrateFixture.svelte",
    );
    ({ body } = render(Fixture));
  } finally {
    await vite.close();
  }
  expect(body).toContain("Ctrl");

  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      warnings.push(message.text());
    }
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "platform", { get: () => "MacIntel" });
    // Chromium prefers `userAgentData`, and Playwright sets it to Windows.
    Object.defineProperty(navigator, "userAgentData", {
      get: () => ({ platform: "macOS" }),
    });
  });
  await page.route("**/keyboard-shortcut-hydrate.html", async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      '<div id="app"></div>',
      `<div id="app">${body}</div>`,
    );
    await route.fulfill({ response, body: html });
  });
  const serverKeyCount = (body.match(/<kbd /g) ?? []).length;

  await page.goto("/keyboard-shortcut-hydrate.html");

  const plain = page.getByTestId("plain").locator(".bx--kbd");
  await expect(plain.locator('[aria-hidden="true"]').first()).toHaveText("⇧");
  await expect(plain.nth(1).locator('[aria-hidden="true"]')).toHaveText("⌘");
  // A mismatched hydration would add a second copy of the keys.
  await expect(page.locator(".bx--kbd")).toHaveCount(serverKeyCount);
  await expect(page.getByTestId("muted")).toContainText("⌘");
  await expect(page.getByTestId("forced")).toContainText("⌘");
  expect(warnings.filter((text) => /hydrat/i.test(text))).toEqual([]);
});
