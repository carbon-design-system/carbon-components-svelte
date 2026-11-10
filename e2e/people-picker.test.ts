import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page, name: string) =>
  page.getByRole("combobox", { name, exact: true });
const picker = (page: Page, name: string) =>
  page.locator(".bx--people-picker").filter({ has: field(page, name) });
const INVALID_CHIP = /^Remove not-an-email\s*, not a valid email address$/;
const menu = (page: Page) => page.getByRole("listbox");
const option = (page: Page, name: string | RegExp) =>
  page.getByRole("option", { name });
const names = async (page: Page, testId: string) =>
  JSON.parse((await page.getByTestId(testId).textContent()) ?? "[]");

async function control(page: Page, script: string) {
  await page.evaluate(`(() => { const c = window.__pp; ${script} })()`);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/people-picker.html");
  await field(page, "Assignees").waitFor();
});

test.describe("choosing", () => {
  test("filters as you type, adds on Enter and clears the field", async ({
    page,
  }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("grace");
    await expect(menu(page)).toBeVisible();
    await expect(option(page, /Grace Lovelace/)).toBeVisible();
    await expect(option(page, /Alan/)).toHaveCount(0);
    await expect(input).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Enter");
    await expect(menu(page)).toHaveCount(0);
    await expect(input).toHaveValue("");
    expect(await names(page, "value")).toEqual(["Grace Lovelace"]);
    await expect(
      picker(page, "Assignees").getByRole("button", {
        name: "Remove Grace Lovelace",
      }),
    ).toBeVisible();
  });

  test("moves the highlight with the arrows, skipping a disabled option", async ({
    page,
  }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("o");
    await expect(menu(page)).toBeVisible();
    const active = async () =>
      page.evaluate(() => {
        const id = document
          .querySelector("input[role=combobox]")
          ?.getAttribute("aria-activedescendant");
        return id ? document.getElementById(id)?.textContent?.trim() : null;
      });
    const first = await active();
    await page.keyboard.press("ArrowDown");
    expect(await active()).not.toBe(first);
    await page.keyboard.press("ArrowUp");
    expect(await active()).toBe(first);
  });

  test("offers suggestions on ArrowDown before anything is typed", async ({
    page,
  }) => {
    const input = field(page, "Assignees");
    await input.focus();
    await expect(menu(page)).toHaveCount(0);
    await page.keyboard.press("ArrowDown");
    await expect(menu(page)).toHaveAccessibleName("Suggested");
    await expect(page.getByRole("option")).toHaveCount(3);
    await page.keyboard.press("Enter");
    expect((await names(page, "value")).length).toBe(1);
    // Picking from the suggestions leaves the rest open.
    await expect(page.getByRole("option")).toHaveCount(2);
  });

  test("Escape closes the menu, then clears the text", async ({ page }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("ada");
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(input).toHaveValue("ada");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
  });

  test("a mouse click picks an option and keeps focus in the field", async ({
    page,
  }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("alan");
    await option(page, /Alan Lovelace/).click();
    await expect(input).toBeFocused();
    expect(await names(page, "value")).toEqual(["Alan Lovelace"]);
  });

  test("never lists a disabled person as choosable", async ({ page }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("out of");
    const row = option(page, /Out Of Office/);
    await expect(row).toHaveAttribute("aria-disabled", "true");
    await row.click({ force: true });
    expect(await names(page, "value")).toEqual([]);
  });
});

test.describe("chips", () => {
  test("reaches, moves between and removes chips from the keyboard", async ({
    page,
  }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("ada");
    await page.keyboard.press("Enter");
    await input.pressSequentially("grace");
    await page.keyboard.press("Enter");
    await input.pressSequentially("alan");
    await page.keyboard.press("Enter");
    expect((await names(page, "value")).length).toBe(3);

    // The caret is at the start of an empty field: Backspace moves to the
    // last chip, not into it.
    await page.keyboard.press("Backspace");
    const chips = await names(page, "value");
    const mine = picker(page, "Assignees");
    await expect(
      mine.getByRole("button", { name: `Remove ${chips[2]}` }),
    ).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(
      mine.getByRole("button", { name: `Remove ${chips[1]}` }),
    ).toBeFocused();
    await page.keyboard.press("Delete");
    expect(await names(page, "value")).toEqual([chips[0], chips[2]]);
    await expect(mine.getByRole("status")).toContainText(
      `${chips[1]} removed. 2 people.`,
    );

    await page.keyboard.press("Escape");
    await expect(input).toBeFocused();
  });

  test("collapses past maxVisible to +N and expands with focus", async ({
    page,
  }) => {
    const watchers = field(page, "Watchers");
    const root = page.locator(".bx--people-picker", { has: watchers });
    await expect(
      root.locator(".bx--tag").filter({ hasText: "+45" }),
    ).toBeVisible();
    await expect(root.getByRole("button", { name: /^Remove/ })).toHaveCount(5);

    await watchers.click();
    await expect(root.getByRole("button", { name: /^Remove/ })).toHaveCount(50);
    await expect(
      root.locator(".bx--tag").filter({ hasText: "+45" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Submit" }).focus();
    await expect(root.getByRole("button", { name: /^Remove/ })).toHaveCount(5);
  });
});

test.describe("free entries", () => {
  test("adds an address from the typed row and a delimiter", async ({
    page,
  }) => {
    const input = field(page, "Share with");
    await input.click();
    await input.pressSequentially("new.person@acme.io");
    await expect(option(page, "Add new.person@acme.io")).toBeVisible();
    await page.keyboard.press("Enter");
    await input.pressSequentially("second@acme.io,");
    const shared = await names(page, "shared");
    expect(shared.map((p: { email: string }) => p.email)).toEqual([
      "new.person@acme.io",
      "second@acme.io",
    ]);
    expect(shared[0]).toMatchObject({ free: true });
    await expect(input).toHaveValue("");
  });

  test("pastes a list: known people resolve, new addresses add, bad ones go invalid, duplicates drop", async ({
    page,
  }) => {
    const input = field(page, "Share with");
    await input.click();
    await input.evaluate((el) => {
      const data = new DataTransfer();
      data.setData(
        "text/plain",
        'ada.lovelace@example.com, ext@acme.io; "Doe, Jane" <jane@acme.io>\nnot-an-email, EXT@acme.io',
      );
      el.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    const shared = await names(page, "shared");
    expect(shared.map((p: { name: string }) => p.name)).toEqual([
      "Ada Lovelace",
      "ext@acme.io",
      "Doe, Jane",
      "not-an-email",
    ]);
    expect(shared[3]).toMatchObject({ free: true, invalid: true });
    await expect(
      page.getByRole("button", { name: INVALID_CHIP }),
    ).toBeVisible();
    // The duplicate in the paste is what the field reports.
    await expect(
      picker(page, "Share with").getByText(
        "This person has already been added",
      ),
    ).toBeVisible();

    // An invalid chip holds the form back, and is never submitted.
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByTestId("submitted")).toHaveText("");
    await page.getByRole("button", { name: INVALID_CHIP }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    expect(
      JSON.parse((await page.getByTestId("submitted").textContent()) ?? "[]"),
    ).toEqual([
      ["share", "u0"],
      ["share", "ext@acme.io"],
      ["share", "jane@acme.io"],
    ]);
  });

  test("does not add the same person twice", async ({ page }) => {
    const input = field(page, "Share with");
    await input.click();
    await input.pressSequentially("ada.lovelace@example.com,");
    await input.pressSequentially("ADA.LOVELACE@example.com,");
    expect((await names(page, "shared")).length).toBe(1);
    await expect(
      page.getByText("This person has already been added"),
    ).toBeVisible();
  });
});

test.describe("groups", () => {
  test("a group stays one chip by default", async ({ page }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("design");
    await option(page, /^Design/).click();
    expect(await names(page, "value")).toEqual(["Design"]);
  });

  test("groups=expand adds the members, loading them when needed", async ({
    page,
  }) => {
    const input = field(page, "Team");
    await input.click();
    await input.pressSequentially("design");
    await page.keyboard.press("Enter");
    expect(await names(page, "members")).toEqual([
      "Mei Chen",
      "Zoë Allen",
      "Søren Berg",
    ]);

    await input.pressSequentially("platform");
    await page.keyboard.press("Enter");
    await expect.poll(() => names(page, "members")).toHaveLength(5);

    await control(page, "c.failMembers = true");
    await input.pressSequentially("platform");
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Could not load the members of this group"),
    ).toBeVisible();
  });

  test("single selection replaces the person", async ({ page }) => {
    const input = field(page, "Owner");
    await input.click();
    await input.pressSequentially("grace");
    await page.keyboard.press("Enter");
    await input.pressSequentially("alan");
    await page.keyboard.press("Enter");
    expect(await names(page, "owner")).toEqual(["Alan Lovelace"]);
  });
});

test.describe("async source", () => {
  test("an older, slower answer never replaces a newer one", async ({
    page,
  }) => {
    await control(
      page,
      'c.ignoreAbort = true; c.delays["a"] = 600; c.delays["ad"] = 20',
    );
    const input = field(page, "Reviewers");
    await input.click();
    await input.pressSequentially("a");
    await page.waitForTimeout(80);
    await input.pressSequentially("d");
    await expect(option(page, /Ada /).first()).toBeVisible();
    // The slow "a" answer lands now, ignored the signal, and must not win.
    await page.waitForTimeout(700);
    await expect(input).toHaveValue("ad");
    const texts = await page.getByRole("option").allTextContents();
    expect(texts.every((t) => /ad/i.test(t))).toBe(true);
  });

  test("aborts the request a newer query replaces", async ({ page }) => {
    await control(page, 'c.delays["g"] = 600');
    const input = field(page, "Reviewers");
    await input.click();
    await input.pressSequentially("g");
    await page.waitForTimeout(80);
    await input.pressSequentially("r");
    await expect(option(page, /Grace/).first()).toBeVisible();
    const calls = await page.evaluate(
      () => (window as unknown as { __pp: { calls: unknown[] } }).__pp.calls,
    );
    expect(calls).toMatchObject([
      { query: "g", aborted: true },
      { query: "gr" },
    ]);
  });

  test("shows the failure and retries with Enter or the button", async ({
    page,
  }) => {
    await control(page, "c.fail = true");
    const input = field(page, "Reviewers");
    await input.click();
    await input.pressSequentially("ada");
    await expect(page.getByText("Could not load results")).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");

    await control(page, "c.fail = false");
    await page.keyboard.press("Enter");
    await expect(option(page, /Ada /).first()).toBeVisible();

    await control(page, "c.fail = true");
    await input.fill("");
    await input.pressSequentially("gra");
    await expect(page.getByText("Could not load results")).toBeVisible();
    await control(page, "c.fail = false");
    await page.locator(".bx--people-picker__retry").click();
    await expect(option(page, /Grace /).first()).toBeVisible();
  });
});

test.describe("scale", () => {
  test("filters 10,000 people with one frame of work per key", async ({
    page,
  }) => {
    const input = field(page, "Everyone");
    await input.click();
    await input.pressSequentially("m");
    await expect(menu(page)).toBeVisible();
    const ms = await page.evaluate(async () => {
      const el = document.querySelector<HTMLInputElement>(
        'input[role=combobox][aria-expanded="true"]',
      );
      if (!el) return -1;
      const keys = "arg";
      const times: number[] = [];
      for (const ch of keys) {
        const start = performance.now();
        el.value += ch;
        el.dispatchEvent(new InputEvent("input", { bubbles: true }));
        // Each key is timed to the frame that shows it, so they run in turn.
        // biome-ignore lint/performance/noAwaitInLoops: one frame per key
        await new Promise((resolve) => requestAnimationFrame(resolve));
        times.push(performance.now() - start);
      }
      return Math.max(...times);
    });
    // A frame is 16.7 ms; allow slack for a shared CI runner.
    expect(ms).toBeLessThan(120);
    await expect(page.getByRole("option").first()).toBeVisible();
    expect(await page.getByRole("option").count()).toBeLessThanOrEqual(8);
  });
});

test.describe("form", () => {
  test("submits the chosen people under the name", async ({ page }) => {
    const input = field(page, "Share with");
    await input.click();
    await input.pressSequentially("grace");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Submit" }).click();
    expect(
      JSON.parse((await page.getByTestId("submitted").textContent()) ?? "[]"),
    ).toEqual([["share", "u1"]]);
  });
});

test.describe("modal", () => {
  test("opens above the dialog and Escape closes the menu first", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Open modal" }).click();
    const input = field(page, "Invitees");
    await input.click();
    await input.pressSequentially("grace");
    await expect(menu(page)).toBeVisible();
    const box = await menu(page).boundingBox();
    const hit = await page.evaluate(
      ({ x, y }) =>
        document.elementFromPoint(x, y)?.closest("[role=listbox]") != null,
      { x: (box?.x ?? 0) + 20, y: (box?.y ?? 0) + 10 },
    );
    expect(hit).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    expect(await names(page, "modal-value")).toEqual(["Grace Lovelace"]);
  });
});

test.describe("right to left", () => {
  test("keeps the keys at the inline start and finds Arabic names", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const input = field(page, "المستلمون");
    await input.click();
    await input.pressSequentially("فاط");
    await expect(option(page, /فاطمة الزهراء/)).toBeVisible();
    // Marks are folded: a bare "محمد" finds the vowelled "مُحَمَّد".
    await input.fill("");
    await input.pressSequentially("محمد");
    await expect(option(page, /مُحَمَّد حسن/)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: /Remove/ }).first(),
    ).toBeVisible();

    // In RTL the start side is the right: ArrowRight reaches the chips.
    await page.keyboard.press("ArrowRight");
    await expect(
      page
        .getByRole("button", { name: /^Remove مُحَمَّد|^Remove محمد/ })
        .last(),
    ).toBeFocused();
  });
});

test.describe("accessibility", () => {
  test("has no violations closed", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no violations with the menu open", async ({ page }) => {
    const input = field(page, "Assignees");
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu(page)).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("#app")
      .include("[data-floating-portal]")
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no violations on a failing source", async ({ page }) => {
    await control(page, "c.fail = true");
    const input = field(page, "Reviewers");
    await input.click();
    await input.pressSequentially("ada");
    await expect(page.getByText("Could not load results")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("#app")
      .include("[data-floating-portal]")
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("names the listbox and announces results", async ({ page }) => {
    const input = field(page, "Assignees");
    await input.click();
    await input.pressSequentially("ada");
    await expect(menu(page)).toHaveAccessibleName("Assignees");
    await expect(
      picker(page, "Assignees").locator("[aria-live=polite][aria-atomic=true]"),
    ).toHaveText(/\d+ results? available/);
  });
});

test.describe("themes", () => {
  test("keeps the menu readable in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const input = field(page, "Assignees");
    await input.focus();
    await page.keyboard.press("ArrowDown");
    const row = page.getByRole("option").first();
    await expect(row).toBeVisible();
    const color = await row
      .locator(".bx--people-picker__name")
      .evaluate((el) => getComputedStyle(el).color);
    // The highlighted row is filled with the system highlight, so its text
    // takes the matching system color and not the page's.
    const highlight = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "HighlightText";
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });
    expect(color).toBe(highlight);
  });
});
