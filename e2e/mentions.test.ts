import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const comment = (page: Page) => page.getByTestId("comment");
const menu = (page: Page) => page.getByRole("listbox", { name: /.+/ });
const option = (page: Page, name: string | RegExp) =>
  page.getByRole("option", { name });

async function boxOf(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("no box");
  return found;
}

/** Type the keys of `text` one by one. */
async function type(field: Locator, text: string) {
  await field.pressSequentially(text);
}

async function control(page: Page, script: string) {
  await page.evaluate(`(() => { const c = window.__mentions; ${script} })()`);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/mentions.html");
  await comment(page).waitFor();
});

test.describe("opening", () => {
  test("opens on a trigger after a space and filters as you type", async ({
    page,
  }) => {
    await comment(page).click();
    await type(comment(page), "Hello @ali");
    await expect(menu(page)).toBeVisible();
    await expect(option(page, /Alice Johnson/)).toBeVisible();
    await expect(option(page, /Bob Smith/)).toHaveCount(0);
    await expect(page.getByTestId("open")).toHaveText("true");
  });

  test("does not open for an address, inside a word or after the query ends", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "mail a@b");
    await expect(menu(page)).toHaveCount(0);
    await type(field, ".com and @ali");
    await expect(menu(page)).toBeVisible();
    await type(field, " ");
    await expect(menu(page)).toHaveCount(0);
  });

  test("moving the caret into a word does not open it, but typing does", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "hi @ali ");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(menu(page)).toHaveCount(0);
    await type(field, "c");
    await expect(menu(page)).toBeVisible();
  });

  test("holds a short query back and ignores 10:30 and re:", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "at 10:30 re: x :s");
    await expect(menu(page)).toHaveCount(0);
    await type(field, "m");
    await expect(option(page, /smile/)).toBeVisible();
  });

  test("opens a line-start trigger only at the start of a line", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "a /he");
    await expect(menu(page)).toHaveCount(0);
    await page.keyboard.press("Enter");
    await type(field, "/he");
    await expect(option(page, /help/)).toBeVisible();
  });

  test("works in a TextInput", async ({ page }) => {
    const input = page.getByTestId("assignee");
    await input.click();
    await type(input, "@bo");
    await expect(option(page, /Bob Smith/)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("@user2 ");
  });
});

test.describe("keyboard", () => {
  test("ArrowDown, ArrowUp and Enter choose an option", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await expect(option(page, /Alice Johnson/)).toHaveClass(/--highlighted/);
    await page.keyboard.press("ArrowDown");
    await expect(option(page, /Alina Johnson/)).toHaveClass(/--highlighted/);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    // Wraps to the last option.
    await expect(menu(page).getByRole("option").last()).toHaveClass(
      /--highlighted/,
    );
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("@user0 ");
    await expect(menu(page)).toHaveCount(0);
    await expect(page.getByTestId("select")).toHaveText("u0");
  });

  test("Tab accepts and Shift+Tab, Ctrl+Enter and Alt+Enter do not", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await page.keyboard.press("Control+Enter");
    await page.keyboard.press("Alt+Enter");
    await expect(field).toHaveValue("@ali");
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(field).toHaveValue("@user0 ");
    await expect(field).toBeFocused();
  });

  test("Escape closes the menu and keeps the text, then bubbles", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "hi @ali");
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(field).toHaveValue("hi @ali");
    // Typing on in the same mention does not reopen it.
    await type(field, "c");
    await expect(menu(page)).toHaveCount(0);
    // A new mention does.
    await type(field, " @bo");
    await expect(menu(page)).toBeVisible();

    // The Escape that closes the menu stops here, so a Modal stays open.
    // The next one has nothing to close and goes on.
    await page.evaluate(() => {
      const w = window as unknown as { __escapes: number };
      w.__escapes = 0;
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") w.__escapes += 1;
      });
    });
    const escapes = () =>
      page.evaluate(
        () => (window as unknown as { __escapes: number }).__escapes,
      );
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    expect(await escapes()).toBe(0);
    await page.keyboard.press("Escape");
    expect(await escapes()).toBe(1);
  });

  test("Enter is a newline when no menu is open", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, "a");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("a\n");
  });

  test("a click on an option accepts it and keeps focus in the field", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await option(page, /Alina Johnson/).click();
    await expect(field).toHaveValue("@user1 ");
    await expect(field).toBeFocused();
  });

  test("undo restores what was typed", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, "hi @ali");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("hi @user0 ");
    await page.keyboard.press("ControlOrMeta+z");
    // Chromium and Firefox undo the choice alone; WebKit joins it with the
    // typing before it. Either way the mention is gone.
    await expect(field).not.toHaveValue(/@user0/);
    await expect(field).toHaveValue(/^(hi @ali|)$/);
  });

  test("announces the result count and wires the field to the menu", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await expect(page.getByText("8 suggestions available")).toBeAttached();
    const controls = await field.getAttribute("aria-controls");
    expect(controls).toBe(await menu(page).getAttribute("id"));
    const active = await field.getAttribute("aria-activedescendant");
    expect(await option(page, /Alice Johnson/).getAttribute("id")).toBe(active);
    await page.keyboard.press("ArrowDown");
    expect(await field.getAttribute("aria-activedescendant")).not.toBe(active);
    await page.keyboard.press("Escape");
    await expect(field).not.toHaveAttribute("aria-controls");
    await expect(field).not.toHaveAttribute("aria-activedescendant");
    await expect(field).toHaveAttribute("aria-autocomplete", "list");
  });
});

test.describe("what is written", () => {
  test("text format records the mention and follows edits", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "hi @ali");
    await page.keyboard.press("Enter");
    const read = async () =>
      JSON.parse((await page.getByTestId("mentions").textContent()) ?? "[]");
    await expect
      .poll(read)
      .toEqual([
        { trigger: "@", id: "u0", text: "Alice Johnson", start: 3, end: 9 },
      ]);

    // Text typed before it moves it.
    await field.evaluate((el: HTMLTextAreaElement) =>
      el.setSelectionRange(0, 0),
    );
    await type(field, ">> ");
    await expect
      .poll(async () => (await read())[0])
      .toMatchObject({ start: 6, end: 12 });

    // Text typed after it leaves it alone.
    await field.evaluate((el: HTMLTextAreaElement) =>
      el.setSelectionRange(el.value.length, el.value.length),
    );
    await type(field, "thanks");
    await expect
      .poll(async () => (await read())[0])
      .toMatchObject({ start: 6, end: 12 });

    // Changing a character inside it drops it.
    await field.evaluate((el: HTMLTextAreaElement) =>
      el.setSelectionRange(10, 10),
    );
    await page.keyboard.press("Backspace");
    await expect.poll(read).toEqual([]);
  });

  test("deleting back into a mention reopens it", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await page.keyboard.press("Enter");
    await expect(menu(page)).toHaveCount(0);
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("@user0");
    await expect(option(page, /Alice Johnson/)).toBeVisible();
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("@user");
  });

  test("token format writes the id into the value", async ({ page }) => {
    const field = page.getByTestId("token");
    await field.click();
    await type(field, "cc @bo");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("cc @[Bob Johnson](u2) ");
    expect(
      JSON.parse(
        (await page.getByTestId("token-mentions").textContent()) ?? "",
      ),
    ).toEqual([
      { trigger: "@", id: "u2", text: "Bob Johnson", start: 3, end: 21 },
    ]);
  });

  test("plain format replaces the trigger and records nothing", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "yay :tad");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("yay \u{1F389} ");
    await expect(page.getByTestId("mentions")).toHaveText("[]");
  });
});

test.describe("async sources", () => {
  test("shows a loading row after the delay, then the results", async ({
    page,
  }) => {
    await control(page, "c.delay = () => 900;");
    const field = comment(page);
    await field.click();
    await type(field, "#4");
    await expect(menu(page)).toHaveCount(0);
    await expect(page.getByText("Loading...").first()).toBeVisible();
    await expect(menu(page)).toHaveAttribute("aria-busy", "true");
    await expect(option(page, /T-41/)).toBeVisible();
    await expect(page.getByText("3 suggestions available")).toBeAttached();
  });

  test("a slow answer never replaces a newer one", async ({ page }) => {
    // The first query is slow and the source ignores the abort signal, so
    // its answer really does arrive late.
    await control(
      page,
      `c.ignoreAbort = true; c.delay = (q) => (q === "1" ? 700 : 50);`,
    );
    const field = comment(page);
    await field.click();
    await type(field, "#1");
    await type(field, "2");
    await expect(option(page, /T-121/)).toBeVisible();
    await page.waitForTimeout(900);
    await expect(option(page, /T-121/)).toBeVisible();
    await expect(option(page, /T-11\b/)).toHaveCount(0);
  });

  test("aborts the request a newer query replaces", async ({ page }) => {
    await control(page, "c.delay = () => 5000;");
    const field = comment(page);
    await field.click();
    await type(field, "#ab");
    await page.keyboard.press("Escape");
    const aborted = await page.evaluate(
      () =>
        (window as unknown as { __mentions: { aborted: string[] } }).__mentions
          .aborted,
    );
    expect(aborted).toEqual(["", "a", "ab"].slice(0, aborted.length));
    expect(aborted.length).toBeGreaterThanOrEqual(2);
  });

  test("shows a message when the source fails and recovers on the next key", async ({
    page,
  }) => {
    await control(page, `c.fail = (q) => q === "x";`);
    const field = comment(page);
    await field.click();
    await type(field, "#x");
    await expect(
      page.getByText("Could not load results").first(),
    ).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("#x\n");
    await page.keyboard.press("Backspace");
    await type(field, "y");
    await expect(option(page, /T-xy1/)).toBeVisible();
  });

  test("shows the empty row when nothing matches", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@zzzz");
    await expect(page.getByText("No results").first()).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("@zzzz\n");
  });
});

test.describe("IME", () => {
  test("a composition closes the menu and takes no keys", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await expect(menu(page)).toBeVisible();

    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "c",
      selectionStart: 1,
      selectionEnd: 1,
    });
    // The IME's candidate window sits where the menu would.
    await expect(menu(page)).toHaveCount(0);
    await expect(field).toHaveAttribute("aria-autocomplete", "list");
    await expect(field).not.toHaveAttribute("aria-controls");

    await client.send("Input.insertText", { text: "e" });
    await expect(field).toHaveValue("@alie");
    await expect(page.getByText("No results").first()).toBeVisible();
  });

  test("composing after a trigger opens the menu once it ends", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    const field = comment(page);
    await field.click();
    await type(field, "@");
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "bo",
      selectionStart: 2,
      selectionEnd: 2,
    });
    await expect(menu(page)).toHaveCount(0);
    await client.send("Input.insertText", { text: "bo" });
    await expect(option(page, /Bob Johnson/)).toBeVisible();
  });

  test("a key that belongs to the IME does not choose an option", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await expect(menu(page)).toBeVisible();
    // Safari ends the composition before the keydown that commits it, so
    // only keyCode 229 gives that Enter away.
    const handled = await field.evaluate((el) => {
      const down = new KeyboardEvent("keydown", {
        key: "Enter",
        keyCode: 229,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(down);
      const arrow = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(arrow);
      return down.defaultPrevented || arrow.defaultPrevented;
    });
    expect(handled).toBe(false);
    await expect(field).toHaveValue("@ali");
    await expect(page.getByTestId("select")).toHaveText("");
  });
});

test.describe("10,000 users", () => {
  test("filters on every key well inside a frame", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, "@");
    await expect(menu(page)).toBeVisible();
    const times = await page.evaluate(async () => {
      const el = document.querySelector("textarea") as HTMLTextAreaElement;
      const out: number[] = [];
      for (const ch of "user99") {
        const start = performance.now();
        el.setRangeText(ch, el.selectionStart, el.selectionEnd, "end");
        el.dispatchEvent(new InputEvent("input", { bubbles: true, data: ch }));
        // biome-ignore lint/performance/noAwaitInLoops: one frame per key
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        out.push(performance.now() - start);
      }
      return out;
    });
    // Input to the frame after the update: the floor is one frame (17 ms).
    // Taken at the median; the max rides on a busy machine's scheduling.
    const sorted = [...times].sort((a, b) => a - b);
    expect(sorted[Math.floor(sorted.length / 2)]).toBeLessThan(34);
    expect(sorted.at(-1)).toBeLessThan(100);
  });
});

test.describe("position", () => {
  test("sits under the trigger, on the line that holds it", async ({
    page,
  }) => {
    const field = comment(page);
    await field.click();
    await type(field, "line one\nline two @al");
    const box = await boxOf(field);
    const popup = await boxOf(menu(page));
    const lineHeight = await field.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).lineHeight),
    );
    const padding = await field.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).paddingTop),
    );
    const triggerBottom = box.y + padding + lineHeight * 2;
    expect(popup.y).toBeGreaterThanOrEqual(triggerBottom - 1);
    expect(popup.y).toBeLessThan(triggerBottom + 12);
    // Starts at the trigger, not at the field's edge.
    expect(popup.x).toBeGreaterThan(box.x + 40);
  });

  test("sits below the text of a single-line input, not over it", async ({
    page,
  }) => {
    const input = page.getByTestId("assignee");
    await input.click();
    await type(input, "@bo");
    const field = await boxOf(input);
    const lineHeight = await input.evaluate(
      (el) => Number.parseFloat(getComputedStyle(el).fontSize) * 1.2,
    );
    const textBottom = field.y + field.height / 2 + lineHeight / 2;
    await expect(async () => {
      const popup = await boxOf(menu(page));
      expect(popup.y).toBeGreaterThanOrEqual(textBottom - 1);
      expect(popup.y).toBeLessThan(textBottom + 14);
    }).toPass();
  });

  test("follows a trigger that wraps with its word", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await field.evaluate((el) => {
      (el as HTMLTextAreaElement).style.width = "260px";
    });
    await type(field, "aaaa bbbb cccc dddd eeee ffff @a");
    const before = await boxOf(menu(page));
    await type(field, "lice-with-a-long-name");
    await expect
      .poll(async () => (await menu(page).boundingBox())?.y ?? 0)
      .toBeGreaterThan(before.y);
  });

  test("tracks the trigger when the field scrolls", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await type(field, `${"line\n".repeat(8)}@al`);
    const at = await boxOf(menu(page));
    const box = await boxOf(field);
    expect(at.y).toBeGreaterThan(box.y);
    expect(at.y).toBeLessThan(box.y + box.height + 12);
  });

  test("slides back inside the window at the right edge", async ({ page }) => {
    const field = comment(page);
    await field.click();
    await field.evaluate((el) => {
      const area = el as HTMLTextAreaElement;
      area.style.width = "100%";
    });
    await page.setViewportSize({ width: 420, height: 700 });
    await type(field, "word word word word word word @al");
    await expect(async () => {
      const popup = await boxOf(menu(page));
      expect(popup.x).toBeGreaterThanOrEqual(0);
      expect(popup.x + popup.width).toBeLessThanOrEqual(420 + 1);
    }).toPass();
  });

  test("flips above the field near the bottom of the window", async ({
    page,
  }) => {
    const field = comment(page);
    await page.setViewportSize({ width: 900, height: 360 });
    await field.click();
    await field.evaluate((el) => {
      const area = el as HTMLTextAreaElement;
      area.style.marginTop = "170px";
    });
    await type(field, "@al");
    const popup = await boxOf(menu(page));
    const box = await boxOf(field);
    expect(popup.y + popup.height).toBeLessThanOrEqual(box.y + 60);
  });

  test("mirrors under dir=rtl", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const field = comment(page);
    await field.click();
    await type(field, "hi @al");
    const box = await boxOf(field);
    // Text starts at the right edge, so the menu hangs off the trigger toward the left.
    await expect(async () => {
      const popup = await boxOf(menu(page));
      expect(popup.x + popup.width).toBeGreaterThan(box.x + box.width / 2);
      expect(popup.x + popup.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }).toPass();
    await expect(option(page, /Alice Johnson/)).toBeVisible();
  });
});

test.describe("inside a Modal", () => {
  test("opens above the modal, takes keys, and Escape closes only the menu", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();
    const field = page.getByTestId("modal-field");
    await field.click();
    await type(field, "hello @ali");
    await expect(menu(page)).toBeVisible();

    const hit = await menu(page).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + 20, r.y + 10);
      return el.contains(top);
    });
    expect(hit).toBe(true);

    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(1);
    await expect(field).toBeFocused();

    await type(field, " @bo");
    await option(page, /Bob Smith/).click();
    await expect(field).toHaveValue("hello @ali @user26 ");
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(1);
    await expect(field).toBeFocused();

    // Tab leaves for the next control only when no menu is open.
    await page.keyboard.press("Escape");
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(0);
  });
});

test.describe("accessibility", () => {
  test("has no detectable violations, closed or open", async ({ page }) => {
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    await page.keyboard.press("ArrowDown");
    await expect(menu(page)).toBeVisible();
    const open = await new AxeBuilder({ page })
      .include("#app")
      .include("[data-floating-portal]")
      .analyze();
    expect(open.violations).toEqual([]);
  });

  test("fills the highlighted option with Highlight in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const field = comment(page);
    await field.click();
    await type(field, "@ali");
    const row = option(page, /Alice Johnson/);
    await expect(row).toHaveClass(/--highlighted/);
    const system = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const read = (name: string) => {
        probe.style.backgroundColor = name;
        return getComputedStyle(probe).backgroundColor;
      };
      const colors = {
        Highlight: read("Highlight"),
        HighlightText: read("HighlightText"),
      };
      probe.remove();
      return colors;
    });
    await expect
      .poll(() =>
        row.evaluate((el) => {
          const text = el.querySelector(".bx--mentions__text");
          const secondary = el.querySelector(".bx--mentions__secondary");
          return {
            background: getComputedStyle(el).backgroundColor,
            text: text && getComputedStyle(text).color,
            secondary: secondary && getComputedStyle(secondary).color,
          };
        }),
      )
      .toEqual({
        background: system.Highlight,
        text: system.HighlightText,
        secondary: system.HighlightText,
      });
    // The shadow is gone, so the list box menu's own outline draws its edge.
    const edge = await menu(page).evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(edge).toBe("solid");
  });
});
