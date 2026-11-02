import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/**
 * Chromium's accessibility node for the first element matching `selector`.
 * A live region that is ignored (for example inside `inert`) when its text
 * changes is not announced.
 */
async function axNode(page: Page, selector: string) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    const { nodes } = await cdp.send("Accessibility.getPartialAXTree", {
      nodeId,
      fetchRelatives: false,
    });
    return { ignored: nodes[0].ignored };
  } finally {
    await cdp.detach();
  }
}

const summary = ".bx--batch-summary__para";
const cancel = ".bx--batch-summary__cancel";

test("the selection summary is in the accessibility tree before each count change", async ({
  page,
}) => {
  await page.goto("/data-table-batch-actions-overflow.html");
  const rowCheckbox = page.getByRole("checkbox", { name: "Select row" });

  expect(await axNode(page, summary)).toMatchObject({ ignored: false });
  // The closed bar's actions stay out of the tree and the tab order.
  expect(await axNode(page, cancel)).toMatchObject({ ignored: true });

  await rowCheckbox.first().click({ force: true });
  await expect(page.locator(summary)).toHaveText("1 item selected");
  expect(await axNode(page, cancel)).toMatchObject({ ignored: false });

  await rowCheckbox.first().click({ force: true });
  await expect(page.locator(summary)).toHaveText("0 items selected");
  expect(await axNode(page, summary)).toMatchObject({ ignored: false });
});
