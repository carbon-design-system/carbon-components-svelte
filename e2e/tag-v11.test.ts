import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const LONG =
  "status:active AND region:us-south AND service:cloud-object-storage";

/** Resolve a `--cds-*` token to the `rgb()` string computed styles use. */
function token(page: Page, name: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.color = `var(--cds-${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

function style(page: Page, testId: string) {
  return page.getByTestId(testId).evaluate((node) => {
    const s = getComputedStyle(node);
    const label = node.querySelector(".bx--tag__label");
    return {
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      truncated: label ? label.scrollWidth > label.clientWidth : false,
      outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineOffset}`,
      outlineColor: s.outlineColor,
      border: `${s.borderTopStyle} ${s.borderTopWidth}`,
      borderColor: s.borderTopColor,
      background: s.backgroundColor,
      paddingLeft: s.paddingLeft,
      boxShadow: s.boxShadow,
    };
  });
}

const tooltip = (page: Page) => page.locator(".bx--tooltip-portal__content");

test.describe("Tag (Carbon v11)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tag-v11.html");
  });

  test("caps every tag kind at 208px and truncates the label", async ({
    page,
  }) => {
    const ids = [
      "long-static",
      "long-filter",
      "long-interactive",
      "long-operational",
      "long-selectable",
    ];
    const styles = await Promise.all(ids.map((id) => style(page, id)));
    for (const [i, { width, truncated }] of styles.entries()) {
      expect.soft(width, ids[i]).toBeLessThanOrEqual(208);
      expect.soft(width, ids[i]).toBeGreaterThan(200);
      expect.soft(truncated, ids[i]).toBe(true);
    }

    // `maxWidth` overrides the cap.
    expect.soft((await style(page, "long-fit")).width).toBeGreaterThan(208);
  });

  test("draws v11 borders, disabled colors and icon padding", async ({
    page,
  }) => {
    const operational = await style(page, "operational");
    expect.soft(operational.border).toBe("solid 1px");
    expect
      .soft(operational.borderColor)
      .toBe(await token(page, "tag-border-red"));
    expect.soft(operational.boxShadow).toBe("none");
    expect.soft(operational.height).toBe(24);

    const borderDisabled = await token(page, "border-disabled");
    const layer = await token(page, "layer");
    for (const id of ["operational-disabled", "selectable-disabled"]) {
      // biome-ignore lint/performance/noAwaitInLoops: reads one tag at a time
      const disabled = await style(page, id);
      expect.soft(disabled.borderColor, id).toBe(borderDisabled);
      expect.soft(disabled.background, id).toBe(layer);
    }
    expect.soft((await style(page, "selectable")).height).toBe(24);

    expect.soft((await style(page, "icon")).paddingLeft).toBe("4px");
    expect.soft((await style(page, "icon-lg")).paddingLeft).toBe("8px");
    expect.soft((await style(page, "plain")).paddingLeft).toBe("8px");
  });

  test("keeps a TagSet of capped tags inside its container", async ({
    page,
  }) => {
    const container = page.getByTestId("set-container");
    // 360px fits one 208px tag beside the "+4" indicator.
    await expect(container.getByText("+4", { exact: true })).toBeVisible();
    const overflow = await container.evaluate((node) => {
      const right = node.getBoundingClientRect().right;
      return Array.from(node.querySelectorAll(".bx--tag"))
        .filter((tag) => !tag.closest("[data-overflow='true']"))
        .map((tag) => tag.getBoundingClientRect().right - right)
        .filter((past) => past > 0.5);
    });
    expect(overflow).toEqual([]);
  });

  test("has no outer margin on any tag kind or size", async ({ page }) => {
    const margins = await page.getByTestId("margins").evaluate((node) =>
      Array.from(node.querySelectorAll(".bx--tag"), (tag) => {
        const s = getComputedStyle(tag);
        return `${tag.className}: ${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`;
      }),
    );
    expect(margins).toHaveLength(24);
    expect(
      margins.filter((margin) => !margin.endsWith("0px 0px 0px 0px")),
    ).toEqual([]);
  });

  test("spaces TagSet and TagInput tags with the container's 8px gap", async ({
    page,
  }) => {
    // Gaps between neighbors on the same row, and how far any tag runs
    // past the container's right edge.
    function layout(testId: string, tags: string) {
      return page.getByTestId(testId).evaluate((node, tags) => {
        const right = node.getBoundingClientRect().right;
        const boxes = Array.from(node.querySelectorAll(tags))
          .filter((tag) => !tag.closest("[data-overflow='true']"))
          .map((tag) => tag.getBoundingClientRect());
        return {
          count: boxes.length,
          gaps: boxes
            .slice(1)
            .filter((box, i) => box.top === boxes[i].top)
            .map((box, i) => Math.round(box.left - boxes[i].right)),
          overflow: boxes.filter((box) => box.right > right + 0.5).length,
        };
      }, tags);
    }

    const set = await layout("short-set", ".bx--tag--filter");
    expect.soft(set.count).toBe(5);
    expect.soft(set.gaps).toEqual([8, 8, 8, 8]);
    expect.soft(set.overflow).toBe(0);

    const input = await layout("tag-input", ".bx--tag-input .bx--tag--filter");
    expect.soft(input.count).toBe(5);
    expect.soft(input.gaps.length).toBeGreaterThan(0);
    expect.soft(input.gaps.every((gap) => gap === 8)).toBe(true);
    expect.soft(input.overflow).toBe(0);
  });

  test("rings focused interactive tags with a 2px outline", async ({
    page,
  }) => {
    const focus = await token(page, "focus");
    for (const id of ["interactive", "operational", "selectable"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one element has focus at a time
      await page.getByTestId(id).focus();
      const focused = await style(page, id);
      expect.soft(focused.outline, id).toBe("solid 2px 1px");
      expect.soft(focused.outlineColor, id).toBe(focus);
      expect.soft(focused.boxShadow, id).toBe("none");
    }
  });

  test("shows a truncated label in a tooltip on focus and hover", async ({
    page,
  }) => {
    // Each label is measured after its first layout; retry until then.
    for (const id of [
      "long-interactive",
      "long-operational",
      "long-selectable",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one element has focus at a time
      await expect(async () => {
        await page.getByTestId(id).blur();
        await page.getByTestId(id).focus();
        await expect(tooltip(page)).toHaveText(LONG, { timeout: 500 });
      }, id).toPass();
    }

    await page.getByTestId("long-selectable").blur();
    await expect(tooltip(page)).toHaveCount(0);

    await page.getByTestId("long-interactive").hover();
    await expect(tooltip(page)).toHaveText(LONG);
    await page.keyboard.press("Escape");
    await expect(tooltip(page)).toHaveCount(0);

    // A static tag's label becomes a definition tooltip trigger.
    await page.getByTestId("long-static").getByText(LONG).hover();
    await expect(
      page.getByRole("tooltip", { name: LONG, exact: true }),
    ).toBeVisible();
  });

  test("labels the close button with a tooltip, not a native title", async ({
    page,
  }) => {
    const close = page
      .getByTestId("filter")
      .getByRole("button", { name: "Clear filter us-south" });
    await expect(close).not.toHaveAttribute("title");

    await close.hover();
    await expect(tooltip(page)).toHaveText("Clear filter");
    await page.mouse.move(0, 0);
    await expect(tooltip(page)).toHaveCount(0);

    await close.focus();
    await expect(tooltip(page)).toHaveText("Clear filter");
  });
});
