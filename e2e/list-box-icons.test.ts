import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// As in Carbon v11: the chevron sits 12px from the edge and the clear button
// 45px, with a hairline between them. An invalid or warn field adds one
// before the clear button. A highlighted option gets the focus ring and
// keeps its background.

function pseudo(locator: Locator, which: "::before" | "::after") {
  return locator.evaluate((node, pseudoElement) => {
    const style = getComputedStyle(node, pseudoElement);
    return { content: style.content, right: style.right, left: style.left };
  }, which);
}

async function offsetFromEdge(wrapper: Locator, selector: string) {
  const [box, part] = await Promise.all([
    wrapper.locator(".bx--list-box").boundingBox(),
    wrapper.locator(selector).boundingBox(),
  ]);
  if (!box || !part) throw new Error(`missing ${selector}`);
  return Math.round(box.x + box.width - (part.x + part.width));
}

function ring(locator: Locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset}`,
      background: style.backgroundColor,
    };
  });
}

function options(page: Page, testId: string) {
  return page.getByTestId(testId).locator(".bx--list-box__menu-item");
}

test.describe("list box icons and highlight", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/list-box-icons.html");
  });

  test("places the chevron, clear button and dividers", async ({ page }) => {
    const chevrons = await Promise.all(
      ["combobox", "combobox-invalid", "dropdown"].map((testId) =>
        offsetFromEdge(page.getByTestId(testId), ".bx--list-box__menu-icon"),
      ),
    );
    expect(chevrons).toEqual([12, 12, 12]);

    const clears = await Promise.all(
      ["combobox", "combobox-invalid"].map(async (testId) => {
        const wrapper = page.getByTestId(testId);
        return {
          offset: await offsetFromEdge(wrapper, ".bx--list-box__selection"),
          divider: await pseudo(
            wrapper.locator(".bx--list-box__selection"),
            "::after",
          ),
        };
      }),
    );
    for (const clear of clears) {
      expect.soft(clear.offset).toBe(45);
      expect
        .soft(clear.divider)
        .toMatchObject({ content: '""', right: "-5px" });
    }

    const plain = page
      .getByTestId("combobox")
      .locator(".bx--list-box__selection");
    expect.soft((await pseudo(plain, "::before")).content).toBe("none");

    const invalid = page.getByTestId("combobox-invalid");
    expect
      .soft(
        await pseudo(invalid.locator(".bx--list-box__selection"), "::before"),
      )
      .toMatchObject({ content: '""', left: "-5px" });
    expect
      .soft(await offsetFromEdge(invalid, ".bx--list-box__invalid-icon"))
      .toBe(82);
  });

  test("rings the highlighted option without a hover background", async ({
    page,
  }) => {
    await page.getByTestId("combobox").locator("input").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Home");

    const [slack, email, fax] = await options(page, "combobox").all();
    await expect(slack).toHaveClass(/--highlighted/);
    await expect(email).not.toHaveClass(/--highlighted/);

    const highlighted = await ring(slack);
    const resting = await ring(fax);
    expect(highlighted.outline).toBe("solid 2px -2px");
    expect(highlighted.background).toBe(resting.background);
    expect(resting.outline.startsWith("none")).toBe(true);
    expect((await ring(email)).outline.startsWith("none")).toBe(true);
  });

  test("keeps a highlighted selected option's color", async ({ page }) => {
    await page.getByTestId("dropdown").locator(".bx--list-box__field").focus();
    await page.keyboard.press("ArrowDown");

    const email = options(page, "dropdown").nth(1);
    await expect(email).toHaveClass(/--active/);
    await expect(email).toHaveClass(/--highlighted/);

    const selected = await ring(email);
    const layerSelected = await email.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--cds-layer-selected").trim(),
    );
    expect(selected.outline).toBe("solid 2px -2px");
    const swatch = await page.evaluate((color) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = color;
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    }, layerSelected);
    expect(selected.background).toBe(swatch);
  });
});
