import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import {
  expectNoNestedBorders,
  expectNoPageOverflow,
  expectTextFits,
} from "./helpers/layout";

const DOC = ".bx--text-annotations__document";

/** The box of the first text in the document that holds `text`. */
async function boxOf(page: Page, text: string, occurrence = 0) {
  const box = await page.evaluate(
    ([needle, nth]) => {
      const root = document.querySelector(".bx--text-annotations__document")!;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let seen = 0;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const at = (node as Text).data.indexOf(needle as string);
        if (at !== -1 && seen++ === nth) {
          const range = document.createRange();
          range.setStart(node, at);
          range.setEnd(node, at + (needle as string).length);
          const r = range.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }
      }
      return null;
    },
    [text, occurrence] as const,
  );
  if (!box) throw new Error(`No text "${text}"`);
  return box;
}

async function centerOf(page: Page, text: string, occurrence = 0) {
  const box = await boxOf(page, text, occurrence);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** What the highlight registry paints, by name. */
function painted(page: Page, name = "ccs-text-annotation") {
  return page.evaluate((key) => {
    const highlight = CSS.highlights.get(key);
    return highlight ? [...highlight].map((range) => range.toString()) : [];
  }, name);
}

const card = (page: Page) => page.getByRole("dialog");

/** The key the page reads as `mod`; the host's own Meta can differ. */
const modifier = (page: Page) =>
  page.evaluate(() =>
    /Mac|iPhone|iPad/.test(
      (navigator as unknown as { userAgentData?: { platform: string } })
        .userAgentData?.platform ||
        navigator.platform ||
        navigator.userAgent,
    )
      ? "Meta"
      : "Control",
  );

const selectionButton = (page: Page) =>
  page.getByRole("button", { name: "Comment", exact: true }).first();

test.describe("TextAnnotations", () => {
  test("paints annotated ranges without changing the document", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(page.locator(DOC)).toBeVisible();
    await expect.poll(() => painted(page)).not.toEqual([]);
    expect(await page.locator(`${DOC} mark`).count()).toBe(0);
    const text = (await painted(page)).join("|");
    expect(text).toContain("Effective Date");
    expect(text).toContain("fee of 4,200 euros within thirty days");
    expect(text).toContain("sixty days written notice");
    // The shared stretch of two annotations is painted again as an overlap.
    expect(await painted(page, "ccs-text-annotation-overlap")).toEqual([
      "fee of 4,200 euros",
    ]);
  });

  test("lists every annotation in the rail, in document order", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    const items = page.locator("[data-annotation-button]");
    await expect(items).toHaveCount(5);
    await expect(items.first()).toHaveAccessibleName(
      "Comment by Ada Lovelace on “Effective Date”",
    );
    await expect(items.nth(4)).toHaveAccessibleName(
      "Comment by Ada Lovelace on “sixty days written notice”",
    );
  });

  test("aligns rail cards to their text and pushes them apart", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const gaps = await page.evaluate(() => {
      const cards = [
        ...document.querySelectorAll<HTMLElement>("[data-annotation-id]"),
      ].map((el) => el.getBoundingClientRect());
      return {
        first: cards[0].top,
        gaps: cards.slice(1).map((r, i) => r.top - cards[i].bottom),
      };
    });
    const first = await boxOf(page, "Effective Date");
    expect(Math.abs(gaps.first - first.y)).toBeLessThan(2);
    for (const gap of gaps.gaps) expect(gap).toBeGreaterThanOrEqual(7.5);
  });

  test("opens the thread when the pointer rests on a highlight, and keeps it open on the card", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const target = await centerOf(page, "Effective Date");
    await page.mouse.move(target.x - 20, target.y + 60);
    await page.mouse.move(target.x, target.y, { steps: 5 });
    await expect(card(page)).toBeVisible();
    await expect(card(page)).toContainText("Define this term.");
    await expect(card(page)).toHaveAccessibleName(
      "Comment by Ada Lovelace on “Effective Date”",
    );

    const cardBox = (await card(page).boundingBox())!;
    const text = await boxOf(page, "Effective Date");
    expect(cardBox.y).toBeGreaterThan(text.y + text.height - 1);
    // Move across the gap and onto the card: it stays.
    await page.mouse.move(cardBox.x + 40, cardBox.y + 20, { steps: 8 });
    await page.waitForTimeout(600);
    await expect(card(page)).toBeVisible();

    // Leaving closes it.
    await page.mouse.move(cardBox.x + 40, cardBox.y + cardBox.height + 200, {
      steps: 4,
    });
    await expect(card(page)).toBeHidden();
  });

  test("does not open when the pointer only crosses a highlight", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const box = await boxOf(page, "Effective Date");
    await page.mouse.move(box.x - 30, box.y + 4);
    await page.mouse.move(box.x + box.width + 30, box.y + 4, { steps: 12 });
    await page.mouse.move(box.x + box.width + 30, box.y + 200);
    await page.waitForTimeout(700);
    await expect(card(page)).toHaveCount(0);
  });

  test("an unannotated stretch beside the end of a line does not count", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const box = await boxOf(page, "sixty days written notice");
    // Right of the last character of the paragraph, in the room after it.
    const doc = (await page.locator(DOC).boundingBox())!;
    await page.mouse.move(doc.x + doc.width - 40, box.y + box.height / 2 + 24);
    await page.waitForTimeout(700);
    await expect(card(page)).toHaveCount(0);
  });

  test("pins the card on click, and Escape closes it", async ({ page }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const target = await centerOf(page, "indirect or consequential loss");
    await page.mouse.click(target.x, target.y);
    await expect(card(page)).toBeVisible();
    await expect(page.getByTestId("active")).toHaveText("c4");
    // Pinned: leaving does not close it.
    await page.mouse.move(target.x, target.y + 300, { steps: 4 });
    await page.waitForTimeout(600);
    await expect(card(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card(page)).toBeHidden();
    await expect(page.locator(DOC)).toBeFocused();
  });

  test("shows the narrowest annotation at an overlap and lists the others", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    // "monthly fee of 4,200 euros" and "fee of 4,200 euros within thirty
    // days" share "fee of 4,200 euros".
    const target = await centerOf(page, "4,200 euros");
    await page.mouse.click(target.x, target.y);
    await expect(card(page)).toBeVisible();
    await expect(card(page)).toContainText("Is this fee fixed or indexed?");
    const also = card(page).getByRole("group", { name: "Also on this text" });
    await expect(also).toContainText("Alan Turing");
    await also.getByRole("button").click();
    await expect(card(page)).toContainText(
      "Net 30 is short for a public body.",
    );
    await expect(card(page)).toContainText("Agreed. Ask for 45.");
  });

  test("opens a thread from the rail and moves focus into it", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    const button = page.getByRole("button", {
      name: /Comment by Alan Turing on .indirect/,
    });
    await button.click();
    await expect(card(page)).toBeVisible();
    await expect(card(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      card(page).getByRole("textbox", { name: "Reply" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(card(page)).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("replies to a thread from the card", async ({ page }) => {
    await page.goto("/text-annotations.html");
    await page
      .getByRole("button", { name: /Comment by Ada Lovelace on .Effective/ })
      .click();
    await card(page)
      .getByRole("textbox", { name: "Reply" })
      .fill("Added to the glossary.");
    await page.keyboard.press(`${await modifier(page)}+Enter`);
    await expect(card(page)).toContainText("Added to the glossary.");
    await expect(page.getByTestId("events")).toContainText("reply:");
  });

  test("comments on text selected with the pointer", async ({ page }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const target = await centerOf(page, "Late payment");
    await page.mouse.dblclick(target.x, target.y);
    const button = selectionButton(page);
    await expect(button).toBeVisible();
    await button.click();
    const field = page.getByRole("textbox", { name: "Add a comment" });
    await expect(field).toBeFocused();
    // The text stays marked while the field has focus.
    await expect
      .poll(() => painted(page, "ccs-text-annotation-draft"))
      .toHaveLength(1);
    await field.fill("Interest rate looks high.");
    await card(page).getByRole("button", { name: "Comment" }).click();
    await expect(page.getByTestId("count")).toHaveText("6");
    await expect(page.getByTestId("events")).toContainText("create:");
    await expect(
      page.getByRole("button", {
        name: /Comment by Ada Lovelace on .(Late|payment)/,
      }),
    ).toBeVisible();
    await expect
      .poll(() => painted(page, "ccs-text-annotation-draft"))
      .toEqual([]);
  });

  test("keyboard only: select with Shift and the arrows, comment, submit", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await page.locator(DOC).focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press("Shift+ArrowRight");
    await expect(selectionButton(page)).toBeVisible();
    await page.keyboard.press(`${await modifier(page)}+Alt+m`);
    const field = page.getByRole("textbox", { name: "Add a comment" });
    await expect(field).toBeFocused();
    await field.fill("Number the clauses.");
    await page.keyboard.press(`${await modifier(page)}+Enter`);
    await expect(page.getByTestId("count")).toHaveText("6");
    // Focus returns to the document.
    await expect(page.locator(DOC)).toBeFocused();
    await expect(
      page.getByRole("button", { name: /Comment by Ada Lovelace on .1\. Ter/ }),
    ).toBeVisible();
  });

  test("keyboard only: Alt and the arrows move between annotations", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    await page.locator(DOC).focus();
    await page.keyboard.press("Alt+ArrowDown");
    await expect(page.getByTestId("active")).toHaveText("c1");
    await expect(card(page)).toContainText("Define this term.");
    await page.keyboard.press("Alt+ArrowDown");
    await expect(page.getByTestId("active")).toHaveText("c2");
    await page.keyboard.press("Alt+ArrowUp");
    await expect(page.getByTestId("active")).toHaveText("c1");
    // The text is selected, so a screen reader is at it.
    expect(await page.evaluate(() => document.getSelection()!.toString())).toBe(
      "Effective Date",
    );
    // Tab goes from the document into the card.
    await page.keyboard.press("Tab");
    await expect(
      card(page).getByRole("button", { name: "Close" }),
    ).toBeFocused();
  });

  test("keyboard only: the rail is one tab stop with arrow keys", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html");
    const buttons = page.locator("[data-annotation-button]");
    await buttons.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(buttons.nth(4)).toBeFocused();
    // The text it is about is marked while focused.
    await expect(page.getByTestId("active")).toHaveText("c5");
    // One tab stop: the item that was reached last.
    await expect(
      page.locator('[data-annotation-button][tabindex="0"]'),
    ).toHaveCount(1);
    await expect(buttons.nth(4)).toHaveAttribute("tabindex", "0");
  });

  test("finds annotations again after the text is edited", async ({ page }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    await page.evaluate(() => {
      const content = document.querySelector('[data-testid="content"]')!;
      content.insertAdjacentHTML(
        "afterbegin",
        "<p>0. Definitions. Capitalized terms are defined in schedule 1.</p>",
      );
      // And a small edit inside an annotated quote.
      const strong = [...content.querySelectorAll("em")].find((em) =>
        em.textContent?.startsWith("sixty"),
      )!;
      strong.textContent = "sixty days' written notice";
    });
    await expect(page.getByTestId("events")).toContainText("reanchor:");
    const events = await page.getByTestId("events").textContent();
    expect(events).toContain('"status":"moved"');
    expect(events).toContain('"status":"fuzzy"');
    // The highlight follows the new text.
    const text = await centerOf(page, "Effective Date");
    await page.mouse.move(text.x - 10, text.y + 40);
    await page.mouse.move(text.x, text.y, { steps: 4 });
    await expect(card(page)).toContainText("Define this term.");
  });

  test("keeps cards from overlapping after a resize", async ({ page }) => {
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    await page.setViewportSize({ width: 900, height: 700 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const rails = [
            ...document.querySelectorAll<HTMLElement>("[data-annotation-id]"),
          ].map((el) => el.getBoundingClientRect());
          return rails.every(
            (r, i) => i === 0 || r.top >= rails[i - 1].bottom - 0.5,
          );
        }),
      )
      .toBe(true);
    const first = await boxOf(page, "Effective Date");
    const top = await page
      .locator("[data-annotation-id]")
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top - first.y)).toBeLessThan(2);
  });

  test("stacks the rail under the document on a narrow screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto("/text-annotations.html");
    const docBox = (await page.locator(DOC).boundingBox())!;
    const first = (await page
      .locator("[data-annotation-id]")
      .first()
      .boundingBox())!;
    expect(first.y).toBeGreaterThanOrEqual(docBox.y + docBox.height - 1);
    expect(first.x).toBeLessThan(40);
    await page
      .getByRole("button", { name: /Comment by Ada Lovelace on .Effective/ })
      .click();
    const sheet = (await card(page).boundingBox())!;
    // A sheet along the bottom of the window.
    expect(sheet.y + sheet.height).toBeGreaterThan(780);
    expect(sheet.width).toBeGreaterThan(390);
  });

  test("offers to comment on plain text given as a prop", async ({ page }) => {
    await page.goto("/text-annotations.html?text");
    const target = await centerOf(page, "Fees");
    await page.mouse.dblclick(target.x, target.y);
    await expect(selectionButton(page)).toBeVisible();
  });
});

test.describe("TextAnnotations with marks", () => {
  test("wraps text in marks that follow overlaps and unwraps on change", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html?highlight=mark");
    await expect(page.locator(`${DOC} mark`).first()).toBeVisible();
    const marks = await page
      .locator(`${DOC} mark`)
      .evaluateAll((els) => els.map((el) => [el.textContent, el.className]));
    expect(marks.map(([text]) => text).join("")).toContain("Effective Date");
    expect(
      marks
        .filter(([, cls]) => String(cls).includes("--overlap"))
        .map(([t]) => t),
    ).toEqual(["fee of 4,200 euros"]);
    // The text of the document is unchanged by the marks.
    expect(await page.locator(DOC).textContent()).toContain(
      "1. Term. This Agreement begins on the Effective Date and continues",
    );
  });

  test("hovers a mark, opens the card, and marks the active one", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html?highlight=mark");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const target = await centerOf(page, "Effective Date");
    await page.mouse.move(target.x - 12, target.y + 50);
    await page.mouse.move(target.x, target.y, { steps: 4 });
    await expect(card(page)).toContainText("Define this term.");
    await expect(
      page.locator(`${DOC} mark.bx--text-annotations__mark--active`),
    ).toHaveText("Effective Date");
  });

  test("works with plain text given as a prop", async ({ page }) => {
    await page.goto("/text-annotations.html?text&highlight=mark");
    await expect(page.locator(`${DOC} mark`).first()).toBeVisible();
    await expect(page.locator(`${DOC}--text`)).toContainText("1. Term.");
  });
});

test.describe("TextAnnotations bidi", () => {
  test("annotates Arabic and Latin text in one document", async ({ page }) => {
    await page.goto("/text-annotations.html?bidi&highlight=mark");
    await expect(page.locator(`${DOC} mark`).first()).toBeVisible();
    const marks = await page
      .locator(`${DOC} mark`)
      .evaluateAll((els) => els.map((el) => el.textContent));
    expect(marks).toEqual(["اتفاقية الخدمة", "thirty days of invoice"]);
    const target = await centerOf(page, "اتفاقية");
    await page.mouse.move(target.x, target.y + 40);
    await page.mouse.move(target.x, target.y, { steps: 4 });
    await expect(card(page)).toContainText("Check the Arabic title.");
  });
});

test.describe("TextAnnotations in a scrolling frame", () => {
  test("hangs the card from its text after the frame scrolls", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html?scroll&large");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Comment by/ })
      .nth(40)
      .focus();
    await page.keyboard.press("Enter");
    await expect(card(page)).toBeVisible();
    await expect(card(page)).toContainText("Note 40");
    // The text it is about is in view, and the card sits right beside it.
    const frame = (await page.locator(".bx--text-annotations").boundingBox())!;
    const active = await page.evaluate(() => {
      const ranges = CSS.highlights.get("ccs-text-annotation-active")!;
      const r = [...ranges][0].getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });
    expect(active.top).toBeGreaterThanOrEqual(frame.y - 1);
    expect(active.bottom).toBeLessThanOrEqual(frame.y + frame.height + 1);
    const cardBox = (await card(page).boundingBox())!;
    const near = Math.min(
      Math.abs(cardBox.y - active.bottom),
      Math.abs(cardBox.y + cardBox.height - (active.top - 4)),
    );
    expect(near).toBeLessThan(12);
  });
});

test.describe("TextAnnotations at scale", () => {
  test("lays out 200 annotations over 20,000 words", async ({ page }) => {
    await page.goto("/text-annotations.html?large");
    await expect(page.locator(".bx--text-annotations--positioned")).toBeVisible(
      { timeout: 15_000 },
    );
    expect(await page.locator("[data-annotation-id]").count()).toBe(200);
    const gaps = await page.evaluate(() => {
      const rects = [
        ...document.querySelectorAll<HTMLElement>("[data-annotation-id]"),
      ].map((el) => el.getBoundingClientRect());
      return rects.slice(1).map((r, i) => r.top - rects[i].bottom);
    });
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(7.5);
  });

  test("jumps to an annotation far down the document from the rail", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html?large");
    await expect(page.locator(".bx--text-annotations--positioned")).toBeVisible(
      { timeout: 15_000 },
    );
    await page
      .getByRole("button", { name: /Comment by/ })
      .nth(150)
      .focus();
    await page.keyboard.press("Enter");
    await expect(card(page)).toContainText("Note 150");
    const inView = await page.evaluate(() => {
      const selected = [
        ...CSS.highlights.get("ccs-text-annotation-active")!,
      ][0].getBoundingClientRect();
      return selected.top >= 0 && selected.bottom <= window.innerHeight;
    });
    expect(inView).toBe(true);
  });

  test("finds all 200 again after an insertion at the top", async ({
    page,
  }) => {
    await page.goto("/text-annotations.html?large");
    await expect(page.locator(".bx--text-annotations--positioned")).toBeVisible(
      { timeout: 15_000 },
    );
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="content"]')!
        .insertAdjacentHTML("afterbegin", "<p>Inserted paragraph.</p>");
    });
    await expect(page.getByTestId("events")).toContainText("reanchor:");
    const changes = await page.evaluate(() => {
      const text = document.querySelector(
        '[data-testid="events"]',
      )!.textContent!;
      return JSON.parse(text.slice("reanchor:".length));
    });
    expect(changes).toHaveLength(200);
    expect(changes.every((c: { status: string }) => c.status === "moved")).toBe(
      true,
    );
  });
});

test.describe("TextAnnotations in RTL and forced colors", () => {
  test("puts the rail at the inline end in RTL", async ({ page }) => {
    await page.goto("/text-annotations.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    const doc = (await page.locator(DOC).boundingBox())!;
    const item = (await page
      .locator("[data-annotation-id]")
      .first()
      .boundingBox())!;
    expect(item.x + item.width).toBeLessThanOrEqual(doc.x + 1);
    const effective = await boxOf(page, "Effective Date");
    await expect
      .poll(() =>
        page
          .locator("[data-annotation-id]")
          .first()
          .evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBeCloseTo(effective.y, 0);
  });

  test("tells the selected annotation apart in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/text-annotations.html?highlight=mark");
    await expect(page.locator(`${DOC} mark`).first()).toBeVisible();
    const style = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            background: s.backgroundColor,
            decoration: `${s.textDecorationLine} ${s.textDecorationStyle}`,
          };
        });
    const system = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.backgroundColor = "Mark";
      document.body.append(el);
      const color = getComputedStyle(el).backgroundColor;
      el.remove();
      return color;
    });
    const base = await style(`${DOC} mark:not([class*="mark--"])`);
    expect(base.background).toBe(system);
    const target = await centerOf(page, "Effective Date");
    await page.mouse.move(target.x - 10, target.y + 40);
    await page.mouse.move(target.x, target.y, { steps: 4 });
    await expect(card(page)).toBeVisible();
    expect(await style(".bx--text-annotations__mark--active")).toMatchObject({
      decoration: "underline solid",
    });
    expect(await style(".bx--text-annotations__mark--overlap")).toMatchObject({
      decoration: "underline dotted",
    });
    // Cards keep an edge when backgrounds are dropped.
    const edge = await page
      .locator(".bx--text-annotations__item")
      .first()
      .evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(edge).toBe("1px");
    expect(
      await card(page).evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
  });
});

test.describe("TextAnnotations layout", () => {
  for (const width of [1280, 672, 320]) {
    test(`fits its text and the page at ${width}px, with a thread and with a draft`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto("/text-annotations.html");
      await expect(
        page.locator(".bx--text-annotations--positioned"),
      ).toBeVisible();
      await page
        .getByRole("button", { name: /Comment by Ada Lovelace on .Effective/ })
        .click();
      await expect(card(page)).toBeVisible();
      await expectTextFits(card(page));
      await expectNoPageOverflow(page);
      await page.keyboard.press("Escape");
      await expect(card(page)).toBeHidden();

      const target = await centerOf(page, "Late payment");
      await page.mouse.dblclick(target.x, target.y);
      await selectionButton(page).click();
      await expect(
        page.getByRole("textbox", { name: "Add a comment" }),
      ).toBeFocused();
      await expectTextFits(card(page));
      await expectNoPageOverflow(page);
    });
  }

  test("draws no nested borders in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/text-annotations.html");
    await expect(
      page.locator(".bx--text-annotations--positioned"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Comment by Ada Lovelace on .Effective/ })
      .click();
    await expect(card(page)).toBeVisible();
    await expectNoNestedBorders(page);
  });
});
