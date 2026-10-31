import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The log is a scroller whose rows come and go as it moves, so what matters
// here is what only a real layout shows: where it rests while lines arrive,
// whether a row stays under the viewport, and where a found line lands.

function metrics(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>("[role=log]");
    if (!el) throw new Error("no log");
    return {
      gap: Math.round(el.scrollHeight - el.scrollTop - el.clientHeight),
      rows: el.querySelectorAll("[data-line-id]").length,
      lastId: Number(
        [...el.querySelectorAll<HTMLElement>("[data-line-id]")].pop()?.dataset
          .lineId,
      ),
    };
  });
}

// A listener on `document` in the capture phase runs before the component's
// own, while the DOM still holds the previous window, so a part of the
// viewport no row covers is what the browser painted.
function recordGaps(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __gaps: number };
    w.__gaps = 0;
    document.addEventListener(
      "scroll",
      () => {
        const el = document.querySelector("[role=log]");
        if (!el) return;
        const box = el.getBoundingClientRect();
        const rows = [...el.querySelectorAll("[data-line-id]")].map((row) =>
          row.getBoundingClientRect(),
        );
        if (
          rows.length === 0 ||
          Math.min(...rows.map((r) => r.top)) > box.top + 1 ||
          Math.max(...rows.map((r) => r.bottom)) < box.bottom - 1
        ) {
          w.__gaps++;
        }
      },
      true,
    );
  });
}

function stream(page: Page, perFrame: number, frames: number) {
  return page.evaluate(
    ([perFrame, frames]) =>
      new Promise<void>((resolve) => {
        const w = window as unknown as {
          logViewer: { append(lines: string[]): void };
          makeLogLine(index: number): string;
        };
        let n = 100000;
        let left = frames;
        const pump = () => {
          const batch = [];
          for (let i = 0; i < perFrame; i++) batch.push(w.makeLogLine(n++));
          w.logViewer.append(batch);
          if (--left > 0) requestAnimationFrame(pump);
          else resolve();
        };
        requestAnimationFrame(pump);
      }),
    [perFrame, frames] as const,
  );
}

for (const mode of ["", "&wrap"]) {
  test.describe(`LogViewer ${mode ? "wrapped" : "unwrapped"}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/log-viewer.html?lines=3000${mode}`);
      await expect(page.getByRole("log")).toBeVisible();
    });

    test("starts at the newest line", async ({ page }) => {
      await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);
      expect((await metrics(page)).lastId).toBe(2999);
    });

    test("stays on the newest line while 1,000 lines a second arrive, with no blank frames", async ({
      page,
    }) => {
      await recordGaps(page);
      // 17 lines a frame is about 1,000 a second.
      await stream(page, 17, 90);
      await expect
        .poll(() => metrics(page).then((m) => [m.lastId, m.gap]))
        .toEqual([3000 + 17 * 90 - 1, 0]);
      expect(
        await page.evaluate(
          () => (window as unknown as { __gaps: number }).__gaps,
        ),
      ).toBe(0);
    });

    test("pauses when the reader scrolls up, and Jump to latest counts what came", async ({
      page,
    }) => {
      await page.getByRole("log").hover();
      await page.mouse.wheel(0, -600);
      await expect(page.getByTestId("follow")).toHaveText("false");

      const top = () =>
        page.evaluate(
          () => document.querySelector("[role=log]")?.scrollTop ?? -1,
        );
      const before = await top();
      await stream(page, 10, 3);
      await page.waitForTimeout(200);

      // The log does not move under a reader.
      expect(await top()).toBe(before);
      const jump = page.getByRole("button", {
        name: "Jump to latest (30 new)",
      });
      await expect(jump).toBeVisible();

      await jump.click();
      await expect(page.getByTestId("follow")).toHaveText("true");
      await expect
        .poll(() => metrics(page).then((m) => [m.lastId, m.gap]))
        .toEqual([3029, 0]);
    });

    test("follows again when the reader scrolls back to the end", async ({
      page,
    }) => {
      await page.getByRole("log").hover();
      await page.mouse.wheel(0, -600);
      await expect(page.getByTestId("follow")).toHaveText("false");

      await page.mouse.wheel(0, 5000);
      await expect(page.getByTestId("follow")).toHaveText("true");
    });

    test("keeps the lines being read in place while the oldest are dropped", async ({
      page,
    }) => {
      await page.goto(`/log-viewer.html?lines=300&max=300${mode}`);
      await expect(page.getByRole("log")).toBeVisible();
      await page.getByRole("log").hover();
      await page.mouse.wheel(0, -1200);
      await expect(page.getByTestId("follow")).toHaveText("false");
      const firstOnScreen = () =>
        page.evaluate(() => {
          const el = document.querySelector("[role=log]");
          const top = el?.getBoundingClientRect().top ?? 0;
          const row = [...(el?.querySelectorAll("[data-line-id]") ?? [])].find(
            (candidate) => candidate.getBoundingClientRect().bottom > top + 1,
          ) as HTMLElement | undefined;
          return Number(row?.dataset.lineId);
        });

      const before = await firstOnScreen();
      await stream(page, 10, 3);
      await page.waitForTimeout(300);

      expect(await firstOnScreen()).toBe(before);
    });

    test("brings each found line into view, forward, back and around the ends", async ({
      page,
    }) => {
      const search = page.getByRole("searchbox");
      await search.fill("connection refused");
      const count = page.locator(".bx--log-viewer__count");
      await expect(count).toHaveText(/ of 60$/);

      const position = async () =>
        Number((await count.textContent())?.split(" ")[0]);
      const currentInView = () =>
        page.evaluate(() => {
          const el = document.querySelector("[role=log]");
          const current = el?.querySelector(".bx--log-viewer__mark--current");
          if (!el || !current) return false;
          const box = el.getBoundingClientRect();
          const rect = current.getBoundingClientRect();
          return rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
        });

      await expect.poll(currentInView).toBe(true);
      for (const key of [
        "Enter",
        "Enter",
        "Shift+Enter",
        "Shift+Enter",
        "Shift+Enter",
      ]) {
        // biome-ignore lint/performance/noAwaitInLoops: each press waits for the last to settle.
        const before = await position();
        const step = key === "Enter" ? 1 : -1;
        await search.press(key);
        await expect(count).toHaveText(
          `${((before - 1 + step + 60) % 60) + 1} of 60`,
        );
        await expect.poll(currentInView).toBe(true);
      }

      // Jumping across the whole log lands on the line, centered once there is
      // room above and below it.
      await search.press("Home");
      await page.getByRole("button", { name: "Next match" }).click();
      await expect.poll(currentInView).toBe(true);
    });
  });
}

test("a 20,000 character line wraps to its full height and stays at the end", async ({
  page,
}) => {
  await page.goto("/log-viewer.html?lines=200&long&wrap");
  await expect(page.getByRole("log")).toBeVisible();

  const lastRow = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLElement>("[data-line-id]")]
          .pop()
          ?.getBoundingClientRect().height ?? 0,
    );
  await expect.poll(lastRow).toBeGreaterThan(1000);
  await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);
});

test("levels carry a text label, so forced colors keep them apart", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/log-viewer.html?lines=60");
  await expect(page.getByRole("log")).toBeVisible();
  await page.getByRole("searchbox").fill("refused");
  await page.getByRole("searchbox").press("Enter");

  const result = await page.evaluate(() => {
    const el = document.querySelector("[role=log]");
    const level = el?.querySelector(
      ".bx--log-viewer__line--error .bx--log-viewer__level",
    );
    const current = el?.querySelector(".bx--log-viewer__mark--current");
    const link = el?.querySelector<HTMLElement>("a");
    const mark = el?.querySelector(
      ".bx--log-viewer__mark:not(.bx--log-viewer__mark--current)",
    );
    const probe = document.createElement("div");
    document.body.append(probe);
    const resolve = (name: string) => {
      probe.style.backgroundColor = name;
      return getComputedStyle(probe).backgroundColor;
    };
    const out = {
      levelText: level?.textContent?.trim(),
      currentOutline: current ? getComputedStyle(current).outlineStyle : null,
      currentBackground: current
        ? getComputedStyle(current).backgroundColor
        : null,
      highlight: resolve("Highlight"),
      linkColor: link ? getComputedStyle(link).color : null,
      linkText: resolve("LinkText"),
      markBackground: mark ? getComputedStyle(mark).backgroundColor : null,
    };
    probe.remove();
    return out;
  });

  expect(result.levelText).toBe("ERROR");
  expect(result.currentOutline).toBe("solid");
  expect(result.currentBackground).toBe(result.highlight);
  if (result.linkColor) expect(result.linkColor).toBe(result.linkText);
});

test("the log keeps its direction on an RTL page, and the toolbar flips", async ({
  page,
}) => {
  await page.goto("/log-viewer.html?lines=60");
  await expect(page.getByRole("log")).toBeVisible();

  const edge = () =>
    page.evaluate(() => {
      const root = document
        .querySelector(".bx--log-viewer")
        ?.getBoundingClientRect();
      const first = document
        .querySelector(".bx--log-viewer__line-number")
        ?.getBoundingClientRect();
      const search = document
        .querySelector(".bx--log-viewer__search")
        ?.getBoundingClientRect();
      if (!root || !first || !search) throw new Error("missing");
      return {
        numberFromLeft: Math.round(first.left - root.left),
        searchFromLeft: Math.round(search.left - root.left),
        searchFromRight: Math.round(root.right - search.right),
        direction: getComputedStyle(
          document.querySelector("[role=log]") as Element,
        ).direction,
      };
    });

  const ltr = await edge();
  await page.evaluate(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  );
  const rtl = await edge();

  expect(ltr.direction).toBe("ltr");
  expect(rtl.direction).toBe("ltr");
  expect(rtl.numberFromLeft).toBe(ltr.numberFromLeft);
  expect(ltr.searchFromLeft).toBeLessThan(ltr.searchFromRight);
  expect(rtl.searchFromRight).toBeLessThan(rtl.searchFromLeft);
});

test("the line numbers start at the edge of the toolbar's search icon", async ({
  page,
}) => {
  await page.goto("/log-viewer.html?lines=9");
  await expect(page.getByRole("log")).toBeVisible();

  const edges = await page.evaluate(() => {
    const icon = document.querySelector(".bx--search-magnifier-icon");
    const number = document.querySelector(".bx--log-viewer__line-number");
    if (!icon || !number) throw new Error("missing");
    const box = icon.getBoundingClientRect();
    const inset = Number.parseFloat(getComputedStyle(icon).paddingLeft);
    return {
      icon: Math.round(box.left + inset),
      number: Math.round(number.getBoundingClientRect().left),
    };
  });

  expect(edges.number).toBe(edges.icon);
});

test("the message starts at one x on every row", async ({ page }) => {
  // Lines 1 to 12 hold every level, and one- and two-digit line numbers.
  await page.goto("/log-viewer.html?lines=12&time");
  await expect(page.getByRole("log")).toBeVisible();

  const rows = await page.evaluate(() =>
    [...document.querySelectorAll(".bx--log-viewer__line")].map((line) => {
      const text = line.querySelector(".bx--log-viewer__text");
      if (!text) throw new Error("missing");
      return {
        level: line.querySelector(".bx--log-viewer__level")?.textContent,
        left: text.getBoundingClientRect().left,
      };
    }),
  );

  expect(new Set(rows.map((row) => row.level))).toEqual(
    new Set(["DEBUG", "INFO", "WARN", "ERROR"]),
  );
  const lefts = rows.map((row) => row.left);
  expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThanOrEqual(0.5);
});

test.describe("toolbar keyboard", () => {
  const focused = (page: Page) =>
    page.evaluate(
      () =>
        document.activeElement?.getAttribute("aria-label") ??
        document.activeElement?.textContent?.trim(),
    );

  test("the search field and the toolbar buttons are one tab stop each", async ({
    page,
  }) => {
    await page.goto("/log-viewer.html?lines=60");
    await expect(page.getByRole("log")).toBeVisible();
    await page.getByRole("searchbox").focus();

    await page.keyboard.press("Tab");
    expect(await focused(page)).toBe("Match case");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("log")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    expect(await focused(page)).toBe("Match case");
    expect(
      await page.getByRole("toolbar").locator("button[tabindex='0']").count(),
    ).toBe(1);
  });

  test("arrow keys, Home and End move between the buttons", async ({
    page,
  }) => {
    await page.goto("/log-viewer.html?lines=60");
    await expect(page.getByRole("log")).toBeVisible();
    await page.getByRole("button", { name: "Match case" }).focus();

    await page.keyboard.press("ArrowRight");
    expect(await focused(page)).toBe("Use regular expression");
    // With no query, Previous match is unavailable but still focusable.
    await page.keyboard.press("ArrowRight");
    expect(await focused(page)).toBe("Previous match");
    await expect(
      page.getByRole("button", { name: "Previous match" }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("End");
    expect(await focused(page)).toBe("Copy lines");
    await page.keyboard.press("ArrowRight");
    expect(await focused(page)).toBe("Match case");
    await page.keyboard.press("ArrowLeft");
    expect(await focused(page)).toBe("Copy lines");
    await page.keyboard.press("Home");
    expect(await focused(page)).toBe("Match case");

    // The toolbar keeps the last button as its tab stop.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    expect(await focused(page)).toBe("Use regular expression");
  });

  test("Left and Right swap under dir=rtl", async ({ page }) => {
    await page.goto("/log-viewer.html?lines=60");
    await expect(page.getByRole("log")).toBeVisible();
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await page.getByRole("button", { name: "Match case" }).focus();

    await page.keyboard.press("ArrowLeft");
    expect(await focused(page)).toBe("Use regular expression");
    await page.keyboard.press("ArrowRight");
    expect(await focused(page)).toBe("Match case");
  });

  test("the Levels menu keeps its own arrow keys once open", async ({
    page,
  }) => {
    await page.goto("/log-viewer.html?lines=60");
    await expect(page.getByRole("log")).toBeVisible();
    // Levels sits two buttons before the last one.
    await page.getByRole("button", { name: "Match case" }).focus();
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    expect(await focused(page)).toBe("Levels");

    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitemcheckbox", { name: /^INFO/ }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    expect(await focused(page)).toBe("Levels");
  });
});

test("the match arrows stay put while the count changes width", async ({
  page,
}) => {
  await page.goto("/log-viewer.html?lines=400");
  await expect(page.getByRole("log")).toBeVisible();
  const search = page.getByRole("searchbox");
  await search.fill("request");
  const count = page.locator(".bx--log-viewer__count");
  const previous = page.getByRole("button", { name: "Previous match" });

  // Step past the last match, so the count goes from "320 of 320" to
  // "1 of 320".
  const seen = new Set<string>();
  const lefts = new Set<number>();
  for (let step = 0; step < 40 && !seen.has("1 of 320"); step++) {
    // biome-ignore lint/performance/noAwaitInLoops: each step reads the last
    seen.add((await count.textContent())?.trim() ?? "");
    lefts.add(Math.round((await previous.boundingBox())?.x ?? -1));
    await search.press("Enter");
  }

  expect(seen).toContain("320 of 320");
  expect(seen).toContain("1 of 320");
  expect([...lefts]).toHaveLength(1);
});

test("has no detectable accessibility violations in White and Gray 100", async ({
  page,
}) => {
  await page.goto("/log-viewer.html?lines=200");
  await expect(page.getByRole("log", { name: "Build output" })).toBeVisible();
  await page.getByRole("searchbox").fill("connection");
  await page.getByRole("searchbox").press("Enter");
  await page.locator("[data-line]").nth(3).click({ force: true });

  let results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);

  await page.evaluate(() => {
    document.documentElement.classList.add("bx--g100");
    document.documentElement.setAttribute("theme", "g100");
  });
  // Axe reads a color halfway through its transition otherwise.
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; }",
  });
  results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
});
