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
    const hidden =
      style.outlineStyle === "none" ||
      style.outlineColor === "rgba(0, 0, 0, 0)";
    return {
      outline: hidden
        ? "none"
        : `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset}`,
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
    await page.keyboard.press("End");

    const [slack, email, fax] = await options(page, "combobox").all();
    await expect(fax).toHaveClass(/--highlighted/);
    await expect(email).not.toHaveClass(/--highlighted/);

    const highlighted = await ring(fax);
    const resting = await ring(slack);
    expect(highlighted.outline).toBe("solid 2px -2px");
    expect(highlighted.background).toBe(resting.background);
    expect(resting.outline).toBe("none");
    expect((await ring(email)).outline).toBe("none");
  });

  // As in Carbon React, the pointer gets the hover fill and the ring stays
  // with the keyboard.
  for (const testId of ["combobox", "dropdown", "multiselect"]) {
    test(`${testId}: a hovered option takes no ring`, async ({ page }) => {
      const wrapper = page.getByTestId(testId);
      await wrapper.locator(".bx--list-box__field").click();

      const fax = options(page, testId).filter({ hasText: "Fax" });
      await fax.hover();

      await expect(fax).not.toHaveClass(/--highlighted/);
      expect((await ring(fax)).outline).toBe("none");
    });
  }

  // The field's ring and the first option's top edge meet as one 2px line.
  for (const testId of ["combobox", "multiselect"]) {
    test(`${testId}: thins the field ring over a highlighted first option`, async ({
      page,
    }) => {
      const wrapper = page.getByTestId(testId);
      const field =
        testId === "combobox"
          ? wrapper.locator("input")
          : wrapper.locator(".bx--list-box__field");
      const ringElement =
        testId === "combobox"
          ? field
          : wrapper.locator(".bx--list-box__field--wrapper");
      await field.focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Home");

      const first = options(page, testId).first();
      await expect(first).toHaveClass(/--highlighted/);
      expect((await ring(ringElement)).outline).toBe("solid 1px -1px");
      expect((await ring(first)).outline).toBe("none");
      // Border-box, so the ring stays inside the option and the menu.
      expect(
        await first.evaluate((node) => {
          const style = getComputedStyle(node, "::before");
          return `${style.borderTopWidth} ${style.borderLeftWidth} ${style.boxSizing}`;
        }),
      ).toBe("1px 2px border-box");

      await page.keyboard.press("End");
      expect((await ring(first)).outline).toBe("none");
      expect(
        await first.evaluate(
          (node) => getComputedStyle(node, "::before").content,
        ),
      ).toBe("none");
    });
  }

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
