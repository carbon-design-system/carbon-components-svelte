import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/**
 * No screen reader runs here. These tests read the browser's accessibility
 * tree (Chromium, through CDP) and the DOM, which show what a screen reader
 * is given, not what it says.
 */

declare global {
  interface Window {
    __added: string[];
    __announcer: {
      announce: (message: string, options?: object) => void;
      clearAnnouncements: (channel?: string) => void;
      pushAnnouncerHost: (host: Element) => () => void;
    };
  }
}

type AxNode = {
  nodeId: string;
  ignored?: boolean;
  role?: { value: string };
  name?: { value: string };
  childIds?: string[];
  properties?: { name: string; value: { value: unknown } }[];
};

/** The live regions in Chromium's accessibility tree, with their text. */
async function liveRegions(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");
  const { nodes } = (await cdp.send("Accessibility.getFullAXTree")) as {
    nodes: AxNode[];
  };
  await cdp.detach();
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const textOf = (node: AxNode): string[] =>
    node.role?.value === "StaticText"
      ? [node.name?.value ?? ""]
      : (node.childIds ?? []).flatMap((id) => {
          const child = byId.get(id);
          return child ? textOf(child) : [];
        });
  const prop = (node: AxNode, name: string) =>
    node.properties?.find((p) => p.name === name)?.value.value;
  return nodes
    .filter((n) => n.role?.value === "status" || n.role?.value === "alert")
    .map((node) => ({
      role: node.role?.value,
      ignored: !!node.ignored,
      live: prop(node, "live"),
      atomic: prop(node, "atomic"),
      relevant: prop(node, "relevant"),
      text: textOf(node).filter(Boolean),
    }));
}

/** Count what each polite or assertive region has added since this call. */
async function watchAdditions(page: Page) {
  await page.evaluate(() => {
    const added: string[] = [];
    window.__added = added;
    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (
            node instanceof HTMLElement &&
            node.parentElement?.matches("[role=status], [role=alert]")
          )
            added.push(node.textContent ?? "");
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

const added = (page: Page) => page.evaluate(() => [...window.__added]);

test.describe("announcer", () => {
  test("says a message in a polite region the accessibility tree lists", async ({
    page,
    browserName,
  }) => {
    await page.goto("/announcer.html");
    await page.getByTestId("say-saved").click();

    const polite = page.locator("[data-announcer] [role=status]");
    await expect(polite).toHaveText("Saved");
    await expect(page.locator("[data-announcer]")).toHaveClass(
      /bx--visually-hidden/,
    );

    if (browserName !== "chromium") return;
    const regions = await liveRegions(page);
    const region = regions.find((r) => r.text.includes("Saved"));
    expect(region).toMatchObject({
      role: "status",
      ignored: false,
      live: "polite",
      atomic: false,
      relevant: "additions",
    });
  });

  test("says the same message twice as two additions", async ({ page }) => {
    await page.goto("/announcer.html");
    await watchAdditions(page);
    await page.getByTestId("say-saved").click();
    await page.getByTestId("say-saved").click();
    await expect.poll(() => added(page)).toEqual(["Saved", "Saved"]);
    // The first is replaced by the second: the region holds one.
    await expect(
      page.locator("[data-announcer] [role=status] > div"),
    ).toHaveCount(1);
  });

  test("says a failure in the assertive region", async ({
    page,
    browserName,
  }) => {
    await page.goto("/announcer.html");
    await page.getByTestId("say-failed").click();

    await expect(page.locator("[data-announcer] [role=alert]")).toHaveText(
      "Could not save",
    );
    if (browserName !== "chromium") return;
    const region = (await liveRegions(page)).find((r) =>
      r.text.includes("Could not save"),
    );
    expect(region).toMatchObject({ role: "alert", live: "assertive" });
  });

  test("removes a message after its time", async ({ page }) => {
    await page.goto("/announcer.html");
    await page.evaluate(() =>
      window.__announcer.announce("Brief", { clearAfter: 300 }),
    );
    const message = page.locator("[data-announcer] [role=status] > div");
    await expect(message).toHaveText("Brief");
    await expect(message).toHaveCount(0);
  });

  test("holds 100 messages a second from three channels to a few", async ({
    page,
    browserName,
  }) => {
    await page.goto("/announcer.html");
    await watchAdditions(page);

    const result = await page.evaluate(async () => {
      const { announce } = window.__announcer;
      let calls = 0;
      let spent = 0;
      let maxHeld = 0;
      const region = document.querySelector("[data-announcer] [role=status]");
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          const n = calls;
          const t0 = performance.now();
          if (n % 3 === 0)
            announce(`${(n % 7) + 1} results`, {
              channel: "counts",
              throttle: 1000,
              dedupe: true,
            });
          else if (n % 3 === 1)
            announce(`${n} new events`, { channel: "tail", throttle: 1500 });
          else announce("Response started", { channel: "chat", dedupe: true });
          spent += performance.now() - t0;
          calls++;
          maxHeld = Math.max(maxHeld, region?.children.length ?? 0);
          if (performance.now() - start > 3000) {
            clearInterval(timer);
            resolve();
          }
        }, 10);
      });
      return { calls, spent, maxHeld };
    });

    const spoken = await added(page);
    expect(result.calls).toBeGreaterThan(200);
    // counts: one per second; tail: one per 1.5 s; chat: once, being identical.
    expect(
      spoken.filter((t) => t.endsWith("results")).length,
    ).toBeLessThanOrEqual(4);
    expect(
      spoken.filter((t) => t.endsWith("new events")).length,
    ).toBeLessThanOrEqual(3);
    expect(spoken.filter((t) => t === "Response started")).toHaveLength(1);
    expect(spoken.length).toBeLessThanOrEqual(8);
    expect(result.maxHeld).toBeLessThanOrEqual(12);
    // Cost of a call, in microseconds, for the record.
    test.info().annotations.push({
      type: "per-call",
      description: `${Math.round((result.spent / result.calls) * 1000)} us over ${result.calls} calls, ${spoken.length} spoken`,
    });
    if (browserName !== "chromium") return;
    const tree = await liveRegions(page);
    expect(tree.flatMap((r) => r.text).length).toBeLessThanOrEqual(12);
  });

  test("the component takes the messages when it is in the layout", async ({
    page,
  }) => {
    await page.goto("/announcer.html?component");
    await expect(page.getByTestId("announcer-component")).toBeAttached();
    await page.getByTestId("say-saved").click();

    await expect(
      page.getByTestId("announcer-component").locator("[role=status]"),
    ).toHaveText("Saved");
    await expect(page.locator("[data-announcer]")).toHaveCount(1);
  });

  test("puts a message about a field in a modal inside the modal", async ({
    page,
  }) => {
    await page.goto("/announcer.html");
    await page.getByTestId("open-modal").click();
    await page.getByRole("combobox", { name: "Contact" }).fill("sl");

    const inModal = page.locator(
      ".bx--modal-container [data-announcer] [role=status]",
    );
    await expect(inModal).toHaveText("1 result available");
    // None went to the body for this field.
    await expect(
      page.locator("body > [data-announcer] [role=status] > div"),
    ).toHaveCount(0);

    await page.getByTestId("modal-say").click();
    await expect(inModal).toHaveText("Saved in the dialog");
  });

  test("a native modal dialog hides a region outside it, so the message goes inside", async ({
    page,
    browserName,
  }) => {
    await page.goto("/announcer.html");
    await page.getByTestId("open-dialog").click();
    await expect(page.locator("dialog[open]")).toBeVisible();

    // Without a source, the message goes to the body.
    await page.evaluate(() =>
      window.__announcer.announce("On the page", { channel: "page" }),
    );
    await expect(
      page.locator("body > [data-announcer] [role=status]"),
    ).toHaveText("On the page");

    await page.getByTestId("dialog-say").click();
    const inDialog = page.locator("dialog [data-announcer] [role=status]");
    await expect(inDialog).toHaveText("Saved in the dialog");

    if (browserName !== "chromium") return;
    const regions = await liveRegions(page);
    // The page's region is out of the tree while the dialog is modal.
    expect(regions.flatMap((r) => r.text)).not.toContain("On the page");
    expect(regions.flatMap((r) => r.text)).toContain("Saved in the dialog");
  });

  test("a host pushed by an overlay takes every message, and gives the unheard ones back", async ({
    page,
  }) => {
    await page.goto("/announcer.html");
    await page.getByTestId("open-dialog").click();
    const moved = await page.evaluate(async () => {
      const { announce, pushAnnouncerHost } = window.__announcer;
      const dialog = document.querySelector("dialog[open]") as HTMLElement;
      const pop = pushAnnouncerHost(dialog);
      announce("Saved, closing", { channel: "save" });
      await new Promise((resolve) => setTimeout(resolve, 50));
      const inside = dialog.querySelector("[role=status]")?.textContent;
      pop();
      return inside;
    });
    expect(moved).toBe("Saved, closing");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(
      page.locator("body > [data-announcer] [role=status]"),
    ).toHaveText("Saved, closing");
  });

  test("an async source says loading only when slow, and the count once", async ({
    page,
  }) => {
    await page.goto("/announcer.html");
    await watchAdditions(page);
    const input = page.getByRole("textbox", { name: "Search people" });

    // Quick: the answer comes before "loading" would be said.
    await input.fill("P");
    await expect.poll(() => added(page)).toEqual(["200 people"]);

    // Slow: "loading" is said, then the count, once for the fast typing.
    await input.pressSequentially("erson 1", { delay: 20 });
    await expect
      .poll(() => added(page), { timeout: 8000 })
      .toEqual(["200 people", "Loading people", "111 people"]);
  });

  test("has no detectable accessibility violations with a message in the region", async ({
    page,
  }) => {
    await page.goto("/announcer.html?component");
    await page.getByTestId("say-saved").click();
    await expect(page.locator("[role=status]")).toHaveText("Saved");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
