import { expect, test } from "./helpers/host";

test.describe("RadioButtonGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/radio-button-group.html");
  });

  test("renders with legend", async ({ page }) => {
    await expect(
      page.getByRole("radiogroup", { name: "Choose one" }),
    ).toBeVisible();
  });

  test("selects radio button", async ({ page }) => {
    await page
      .getByTestId("radio-group-choice")
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el: HTMLInputElement) => el.click());
    await expect(page.getByTestId("selected-value")).toContainText("two");
  });

  test("can be located by data-testid", async ({ page }) => {
    const group = page.getByTestId("radio-group-choice");
    await expect(group).toBeVisible();
    await group
      .getByRole("radio", { name: "Option Three" })
      .evaluate((el: HTMLInputElement) => el.click());
    await expect(page.getByTestId("selected-value")).toContainText("three");
  });

  test("only one option can be selected at a time", async ({ page }) => {
    const group = page.getByTestId("radio-group-choice");
    await group
      .getByRole("radio", { name: "Option One" })
      .evaluate((el) => el.click());
    await group
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el) => el.click());

    await expect(
      group.getByRole("radio", { name: "Option One" }),
    ).not.toBeChecked();
    await expect(
      group.getByRole("radio", { name: "Option Two" }),
    ).toBeChecked();
  });

  test("allowDeselect clears the selection when clicking the already-selected radio's label", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-deselect");
    const firstLabel = group.locator("label.bx--radio-button__label").first();
    const firstRadio = group.getByRole("radio", { name: "Option One" });

    await expect(firstRadio).toBeChecked();
    await firstLabel.click();

    await expect(firstRadio).not.toBeChecked();
    await expect(page.getByTestId("deselect-selected-value")).toContainText(
      "Selected: ",
    );
  });

  test("allowDeselect still selects a different radio via its label", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-deselect");
    const secondLabel = group.locator("label.bx--radio-button__label").nth(1);

    await secondLabel.click();

    await expect(
      group.getByRole("radio", { name: "Option Two" }),
    ).toBeChecked();
    await expect(
      group.getByRole("radio", { name: "Option One" }),
    ).not.toBeChecked();
  });

  test("readonly group with no name keeps the preselected radio checked after a cancelled click", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-readonly");

    await group
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el: HTMLInputElement) => el.click());

    await expect(
      group.getByRole("radio", { name: "Option Two" }),
    ).not.toBeChecked();
    await expect(
      group.getByRole("radio", { name: "Option One" }),
    ).toBeChecked();
  });

  const splitWords = (root: Element) => {
    const out: string[] = [];
    const range = document.createRange();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const match of (node.textContent ?? "").matchAll(/\S+/g)) {
        range.setStart(node, match.index ?? 0);
        range.setEnd(node, (match.index ?? 0) + match[0].length);
        const tops = new Set(
          [...range.getClientRects()]
            .filter((rect) => rect.width > 0)
            .map((rect) => Math.round(rect.top)),
        );
        if (tops.size > 1) out.push(match[0]);
      }
    }
    return out;
  };

  // Rows of buttons (by wrapper top) and the gap above each later row.
  const layout = (root: Element) => {
    const wrappers = [...root.querySelectorAll(".bx--radio-button-wrapper")];
    const rects = wrappers.map((el) => el.getBoundingClientRect());
    const rowGaps: number[] = [];
    for (let i = 1; i < rects.length; i++) {
      if (Math.round(rects[i].top) > Math.round(rects[i - 1].top)) {
        rowGaps.push(Math.round(rects[i].top - rects[i - 1].bottom));
      }
    }
    const box = root.parentElement?.getBoundingClientRect();
    const right = Math.max(...rects.map((r) => r.right));
    return {
      rowGaps,
      spill: box ? Math.round(right - box.right) : 0,
    };
  };

  test("the split-word detector flags a word broken across lines", async ({
    page,
  }) => {
    const flagged = await page.evaluate((src) => {
      const el = document.createElement("div");
      el.style.cssText = "width: 3ch; word-break: break-all";
      el.textContent = "Compact";
      document.body.append(el);
      const fn = new Function(`return (${src})`)();
      const out = fn(el);
      el.remove();
      return out;
    }, splitWords.toString());
    expect(flagged).toEqual(["Compact"]);
  });

  for (const id of ["narrow", "240", "320"]) {
    test(`wraps buttons ${id === "narrow" ? "in 12rem" : `at ${id}px`} 8px apart without splitting words`, async ({
      page,
    }) => {
      const group = page.getByTestId(`radio-group-${id}`);
      const { rowGaps, spill } = await group.evaluate(layout);
      expect(rowGaps.length).toBeGreaterThan(0);
      expect(rowGaps.every((gap) => gap === 8)).toBe(true);
      expect(spill).toBeLessThanOrEqual(0);
      expect(await group.evaluate(splitWords)).toEqual([]);
    });
  }

  test("a row too narrow for every button wraps buttons, not words", async ({
    page,
  }) => {
    const labels = page
      .getByTestId("radio-group-narrow")
      .locator(".bx--radio-button__label-text");
    const boxes = await labels.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
        return { top: r.top, lines: Math.round(r.height / lineHeight) };
      }),
    );
    expect(boxes.map((b) => b.lines)).toEqual([1, 1]);
    expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
  });

  test("a single button wider than the row still breaks inside its word", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-long-word");
    const { spill } = await group.evaluate(layout);
    expect(spill).toBeLessThanOrEqual(0);
    const label = group.locator(".bx--radio-button__label-text");
    const lines = await label.evaluate(
      (el) =>
        el.getBoundingClientRect().height /
        Number.parseFloat(getComputedStyle(el).lineHeight),
    );
    expect(Math.round(lines)).toBeGreaterThan(1);
  });

  // Gap from the last row of buttons to the validation message.
  const messageGap = (root: Element) => {
    const wrappers = [...root.querySelectorAll(".bx--radio-button-wrapper")];
    const last = wrappers[wrappers.length - 1].getBoundingClientRect();
    const message = root
      .querySelector(".bx--radio-button-group__validation-msg")
      ?.getBoundingClientRect();
    return message ? Math.round(message.top - last.bottom) : null;
  };

  for (const id of ["invalid-row", "warn-row", "invalid-wrapped"]) {
    test(`the ${id} validation message sits 4px below the buttons`, async ({
      page,
    }) => {
      const group = page.getByTestId(`radio-group-${id}`);
      expect(await group.evaluate(messageGap)).toBe(4);
    });
  }
});
