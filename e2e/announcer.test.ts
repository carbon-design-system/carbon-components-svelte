import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/**
 * No screen reader runs here. These tests read Chromium's accessibility tree
 * through CDP, and the DOM, which show what a screen reader is given, not
 * what it says.
 */

declare global {
  interface Window {
    __added: string[];
    __announce: (
      message: string,
      options?: { channel?: string; debounce?: number },
    ) => void;
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

/** The status regions in Chromium's accessibility tree, with their text. */
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
    .filter((node) => node.role?.value === "status" && !node.ignored)
    .map((node) => ({
      live: prop(node, "live"),
      atomic: prop(node, "atomic"),
      relevant: prop(node, "relevant"),
      text: textOf(node).filter(Boolean),
    }));
}

/** The text of each message added to a status region since this call. */
async function watchAdditions(page: Page) {
  await page.evaluate(() => {
    const added: string[] = [];
    window.__added = added;
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (
            node instanceof HTMLElement &&
            node.parentElement?.matches("[role=status]")
          )
            added.push(node.textContent ?? "");
    }).observe(document, { childList: true, subtree: true });
  });
}

const added = (page: Page) => page.evaluate(() => [...window.__added]);

const spoken = async (page: Page) =>
  (await liveRegions(page)).flatMap((region) => region.text);

test.describe("announcer", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "reads the accessibility tree over CDP",
  );

  test("makes a region on a page without <Announcer />, and the tree lists the message", async ({
    page,
  }) => {
    await page.goto("/announcer.html");
    // The ComboBox in the closed Modal holds a region inside the modal.
    const region = page.locator("body > [data-announcer]");
    await expect(region).toHaveCount(0);
    await page.getByTestId("say-saved").click();

    await expect(region.locator("[role=status]")).toHaveText("Saved");
    await expect(region).toHaveClass(/bx--visually-hidden/);
    expect(await liveRegions(page)).toContainEqual({
      live: "polite",
      atomic: false,
      relevant: "additions",
      text: ["Saved"],
    });
  });

  test("writes to the <Announcer /> in the layout", async ({ page }) => {
    await page.goto("/announcer.html?component");
    await page.getByTestId("say-saved").click();

    await expect(
      page.getByTestId("announcer-component").locator("[role=status]"),
    ).toHaveText("Saved");
    await expect(page.locator("body > [data-announcer]")).toHaveCount(0);
    expect(await spoken(page)).toEqual(["Saved"]);
  });

  test("adds the same message twice as two messages", async ({ page }) => {
    await page.goto("/announcer.html?component");
    await watchAdditions(page);
    await page.getByTestId("say-saved").click();
    await page.getByTestId("say-saved").click();

    await expect.poll(() => added(page)).toEqual(["Saved", "Saved"]);
    // The second replaces the first: the region holds one.
    await expect(
      page.locator("[data-announcer] [role=status] > div"),
    ).toHaveCount(1);
    expect(await spoken(page)).toEqual(["Saved"]);
  });

  test("says a count that changes 50 times in half a second once, after the debounce", async ({
    page,
  }) => {
    await page.goto("/announcer.html?component");
    await watchAdditions(page);
    await page.evaluate(async () => {
      for (let i = 1; i <= 50; i++) {
        window.__announce(`${i} results`, { channel: "count", debounce: 300 });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    await expect.poll(() => added(page)).toEqual(["50 results"]);
    expect(await spoken(page)).toEqual(["50 results"]);
  });

  test("puts a message about an element in Modal inside the modal", async ({
    page,
  }) => {
    await page.goto("/announcer.html?component");
    await page.getByTestId("open-modal").click();
    await page.getByTestId("modal-say").click();

    await expect(
      page.locator(".bx--modal-container [data-announcer] [role=status]"),
    ).toHaveText("Saved in the dialog");
    expect(await spoken(page)).toEqual(["Saved in the dialog"]);
  });

  test("a ComboBox in Modal says its count inside the modal", async ({
    page,
  }) => {
    await page.goto("/announcer.html");
    await page.getByTestId("open-modal").click();
    await page.getByRole("combobox", { name: "Contact" }).fill("sl");

    await expect(
      page.locator(".bx--modal-container [data-announcer] [role=status]"),
    ).toHaveText("1 result available");
    await expect(page.locator("body > [data-announcer]")).toHaveCount(0);
    expect(await spoken(page)).toEqual(["1 result available"]);
  });

  test("puts a message in a native modal dialog inside it, where a region in the body is out of the tree", async ({
    page,
  }) => {
    await page.goto("/announcer.html?component");
    await page.getByTestId("open-dialog").click();
    await expect(page.locator("dialog[open]")).toBeVisible();

    // Without a source, the message goes to the page's region.
    await page.evaluate(() => window.__announce("On the page"));
    await expect(
      page.getByTestId("announcer-component").locator("[role=status]"),
    ).toHaveText("On the page");

    await page.getByTestId("dialog-say").click();
    await expect(
      page.locator("dialog [data-announcer] [role=status]"),
    ).toHaveText("Saved in the dialog");

    // `showModal()` takes the rest of the page out of the tree.
    expect(await spoken(page)).toEqual(["Saved in the dialog"]);
  });

  test("has no detectable accessibility violations with a message in the region", async ({
    page,
  }) => {
    await page.goto("/announcer.html?component");
    await page.getByTestId("say-saved").click();
    await expect(
      page.getByTestId("announcer-component").locator("[role=status]"),
    ).toHaveText("Saved");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
