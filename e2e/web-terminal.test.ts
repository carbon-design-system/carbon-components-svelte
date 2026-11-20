import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A terminal is a scroller whose rows come and go, with a prompt under it.
// What matters here is what only a real browser shows: where the output rests
// while rows arrive, whether the window ever shows blank space, how the keys
// behave, and what the page does with hostile output.

function metrics(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>("[role=log]");
    if (!el) throw new Error("no log");
    const ids = [...el.querySelectorAll<HTMLElement>("[data-line-id]")].map(
      (row) => Number(row.dataset.lineId),
    );
    return {
      gap: Math.round(el.scrollHeight - el.scrollTop - el.clientHeight),
      rows: ids.length,
      lastId: ids.at(-1) ?? -1,
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

function gaps(page: Page) {
  return page.evaluate(() => (window as unknown as { __gaps: number }).__gaps);
}

function pushLines(page: Page, count: number, perFrame: number) {
  return page.evaluate(
    ([count, perFrame]) =>
      (
        window as unknown as {
          pushLines(n: number, perFrame: number): Promise<void>;
        }
      ).pushLines(count, perFrame),
    [count, perFrame] as const,
  );
}

function input(page: Page) {
  return page.getByRole("textbox", { name: "Command" });
}

// Runs a command and, unless told not to, waits for it to finish. The echo
// cannot be waited on: a command that prints a lot scrolls it out of the
// window, and a virtualized row that is not in the window is not in the DOM.
async function run(
  page: Page,
  command: string,
  { wait = true }: { wait?: boolean } = {},
) {
  const finished = Number(await page.getByTestId("finished").textContent());
  await input(page).fill(command);
  await input(page).press("Enter");
  if (wait) {
    await expect(page.getByTestId("finished")).toHaveText(String(finished + 1));
  }
}

function rowTexts(page: Page) {
  return page
    .locator("[role=log] [data-line-id]")
    .evaluateAll((rows) => rows.map((row) => row.textContent?.trim()));
}

test.describe("WebTerminal", () => {
  test.describe("scrollback", () => {
    test("opens 100,000 rows at the newest, drawing a small window", async ({
      page,
    }) => {
      const started = Date.now();
      await page.goto("/web-terminal.html?lines=100000");
      await expect(page.getByRole("log")).toBeVisible();
      await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);
      const m = await metrics(page);
      test.info().annotations.push({
        type: "mount",
        description: `${Date.now() - started} ms including navigation`,
      });

      expect(m.lastId).toBe(99999);
      expect(m.rows).toBeLessThan(200);
    });

    test("scrolls through 100,000 rows with no blank frames", async ({
      page,
    }) => {
      await page.goto("/web-terminal.html?lines=100000");
      await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);
      // Jumping from the end to the start is one blank frame by nature, so
      // count from the start.
      await page.evaluate(() => {
        (document.querySelector("[role=log]") as HTMLElement).scrollTop = 0;
      });
      await expect
        .poll(() => metrics(page).then((m) => m.lastId))
        .toBeLessThan(200);
      await recordGaps(page);

      const frames = await page.evaluate(
        () =>
          new Promise<number[]>((resolve) => {
            const el = document.querySelector("[role=log]") as HTMLElement;
            const times: number[] = [];
            let last = performance.now();
            let left = 150;
            const step = (now: number) => {
              times.push(now - last);
              last = now;
              el.scrollTop += 600;
              if (--left > 0) requestAnimationFrame(step);
              else resolve(times);
            };
            requestAnimationFrame(step);
          }),
      );
      frames.sort((a, b) => a - b);
      const p99 = frames[Math.floor(frames.length * 0.99)];
      test.info().annotations.push({
        type: "scroll p99",
        description: `${p99.toFixed(1)} ms`,
      });

      expect(await gaps(page)).toBe(0);
      expect(p99).toBeLessThan(50);
    });

    test("holds the newest row in view at 1,000 rows a second, with no blank frames", async ({
      page,
    }) => {
      await page.goto("/web-terminal.html?lines=3000");
      await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);
      // The scroll to the end at mount can still be on its way.
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      await recordGaps(page);

      // 17 rows a frame is about 1,000 a second.
      await pushLines(page, 17 * 90, 17);

      await expect
        .poll(() => metrics(page).then((m) => [m.lastId, m.gap]))
        .toEqual([3000 + 17 * 90 - 1, 0]);
      expect(await gaps(page)).toBe(0);
      expect((await metrics(page)).rows).toBeLessThan(250);
    });

    test("drops the oldest rows past maxLines without moving a reader", async ({
      page,
    }) => {
      await page.goto("/web-terminal.html?lines=400&max=500");
      await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);
      await page.getByRole("log").hover();
      await page.mouse.wheel(0, -1500);
      await expect(page.getByTestId("follow")).toHaveText("false");
      const first = () =>
        page.evaluate(
          () =>
            document.querySelector<HTMLElement>("[data-line-id]")?.dataset
              .lineId,
        );
      const before = await first();

      await pushLines(page, 300, 30);
      await page.waitForTimeout(150);

      // 700 rows arrived into 500; the reader's rows were dropped from the
      // top, and the window moved with them rather than jumping.
      expect(Number(await first())).toBeGreaterThanOrEqual(Number(before));
      await expect(
        page.getByRole("button", { name: /Jump to latest \(300 new\)/ }),
      ).toBeVisible();
    });
  });

  test.describe("keyboard", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/web-terminal.html");
      await expect(input(page)).toBeVisible();
    });

    test("runs a command, streams its output and keeps focus in the prompt", async ({
      page,
    }) => {
      await input(page).focus();
      await page.keyboard.type("calc 6*7");
      await page.keyboard.press("Enter");

      await expect(page.locator("[role=log] [data-line-id]")).toHaveCount(2);
      expect(await rowTexts(page)).toEqual(["$ calc 6*7", "42"]);
      await expect(input(page)).toBeFocused();
    });

    test("walks history with the arrow keys", async ({ page }) => {
      await input(page).focus();
      await run(page, "echo one");
      await run(page, "echo two");

      await page.keyboard.press("ArrowUp");
      await expect(input(page)).toHaveValue("echo two");
      await page.keyboard.press("ArrowUp");
      await expect(input(page)).toHaveValue("echo one");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(input(page)).toHaveValue("");
    });

    test("cancels a running command with Control + C and clears with Control + L", async ({
      page,
    }) => {
      await input(page).focus();
      await run(page, "logs 100000 17", { wait: false });
      await expect(page.getByRole("log")).toHaveAttribute("aria-busy", "true");

      await page.keyboard.press("Control+c");

      await expect(page.getByRole("log")).not.toHaveAttribute("aria-busy");
      await expect(input(page)).not.toHaveAttribute("readonly");
      const texts = await rowTexts(page);
      expect(texts.at(-1)).toBe("^C");

      await page.keyboard.press("Control+l");
      await expect(page.locator("[role=log] [data-line-id]")).toHaveCount(0);
    });

    test("completes with Tab, and Escape then Tab leaves the prompt", async ({
      page,
    }) => {
      await input(page).focus();
      await page.keyboard.type("pro");
      await page.keyboard.press("Tab");
      await expect(input(page)).toHaveValue("progress ");
      await expect(input(page)).toBeFocused();

      await page.keyboard.press("Escape");
      await page.keyboard.press("Tab");
      await expect(input(page)).not.toBeFocused();
    });

    test("reaches every control with Tab and scrolls with the paging keys", async ({
      page,
    }) => {
      await input(page).focus();
      await run(page, "flood 300");
      await expect.poll(() => metrics(page).then((m) => m.gap)).toBe(0);

      await page.keyboard.press("PageUp");
      await expect(page.getByTestId("follow")).toHaveText("false");
      await expect(input(page)).toBeFocused();
      await page.keyboard.press("Control+End");
      await expect(page.getByTestId("follow")).toHaveText("true");

      // Backwards from the prompt: the output, then the header buttons.
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByRole("log")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "Maximize" }),
      ).toBeFocused();
    });
  });

  test.describe("output", () => {
    test("overwrites a row for a carriage return", async ({ page }) => {
      await page.goto("/web-terminal.html");
      await run(page, "progress");

      await expect(input(page)).not.toHaveAttribute("readonly");
      const texts = await rowTexts(page);
      expect(texts).toHaveLength(2);
      expect(texts[1]).toBe("downloading [####################] 100%");
    });

    test("draws all sixteen colors, bright colors and the other attributes", async ({
      page,
    }) => {
      await page.goto("/web-terminal.html");
      await run(page, "colors");
      await expect(input(page)).not.toHaveAttribute("readonly");

      const red = page.getByText("red", { exact: true }).first();
      await expect(red).toHaveCSS("color", "rgb(255, 131, 137)");
      await expect(page.getByText("underline", { exact: true })).toHaveCSS(
        "text-decoration-line",
        "underline",
      );
      await expect(page.getByText("bold", { exact: true })).toHaveCSS(
        "font-weight",
        "600",
      );
    });

    test("treats hostile output as text", async ({ page }) => {
      await page.goto("/web-terminal.html");
      await run(page, "adversarial");
      await expect(input(page)).not.toHaveAttribute("readonly");

      expect(await page.locator("[role=log] img, [role=log] a").count()).toBe(
        0,
      );
      expect(
        await page.evaluate(
          () => (window as unknown as { __pwned?: boolean }).__pwned,
        ),
      ).toBeUndefined();
      const texts = await rowTexts(page);
      expect(texts).toContain("hyperlink text");
      expect(texts).toContain("cursor movement is dropped");
      expect(texts).toContain("after a window title");
      expect(texts).toContain("right-to-left override is removed");
    });

    test("wraps long rows when asked, and scrolls sideways when not", async ({
      page,
    }) => {
      await page.goto("/web-terminal.html?wrap");
      await page.evaluate(() =>
        (
          window as unknown as { terminal: { write(t: string): void } }
        ).terminal.write(`${"word ".repeat(120)}\n`),
      );
      const scroller = page.getByRole("log");
      await expect
        .poll(() =>
          scroller.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        )
        .toBe(true);

      await page.goto("/web-terminal.html");
      await page.evaluate(() =>
        (
          window as unknown as { terminal: { write(t: string): void } }
        ).terminal.write(`${"word ".repeat(120)}\n`),
      );
      await expect
        .poll(() =>
          scroller.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
        )
        .toBe(true);
    });
  });

  test.describe("pointer", () => {
    test("shows the copy button on a hovered command and copies it", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/web-terminal.html");
      await run(page, "echo hello");
      const copy = page.locator(".bx--web-terminal__copy-command");
      await expect(copy).toHaveCSS("opacity", "0");

      await page.locator("[role=log] [data-line-id]").first().hover();
      await expect(copy).toHaveCSS("opacity", "1");
      await copy.click();

      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "echo hello",
      );
    });

    test("copies the whole scrollback", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/web-terminal.html");
      await run(page, "echo hello");
      await expect(page.locator("[role=log] [data-line-id]")).toHaveCount(2);

      await page.getByRole("button", { name: "Copy output" }).click();

      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe("$ echo hello\nhello");
    });
  });

  test.describe("themes", () => {
    for (const theme of ["g100", "white"]) {
      test(`has no accessibility violations on ${theme}`, async ({ page }) => {
        await page.goto(`/web-terminal.html?theme=${theme}`);
        await run(page, "colors");
        await expect(input(page)).not.toHaveAttribute("readonly");

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }

    test("keeps the terminal left to right on a right-to-left page", async ({
      page,
    }) => {
      await page.goto("/web-terminal.html");
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      await run(page, "colors");
      await expect(input(page)).not.toHaveAttribute("readonly");

      const direction = (selector: string) =>
        page.evaluate(
          (s) =>
            getComputedStyle(document.querySelector(s) as Element).direction,
          selector,
        );
      expect(await direction("[role=log]")).toBe("ltr");
      expect(await direction(".bx--web-terminal__input")).toBe("ltr");
      // The header around it follows the page: the title sits at the right.
      const title = await page
        .locator(".bx--web-terminal__title")
        .boundingBox();
      const actions = await page
        .locator(".bx--web-terminal__actions")
        .boundingBox();
      expect(title && actions && title.x > actions.x).toBe(true);
    });

    test("drops colors in forced colors and keeps bold and underline", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await page.goto("/web-terminal.html");
      await run(page, "colors");
      await expect(input(page)).not.toHaveAttribute("readonly");

      const color = (text: string) =>
        page
          .getByText(text, { exact: true })
          .first()
          .evaluate((el) => getComputedStyle(el).color);
      const black = await color("black");
      expect(await color("red")).toBe(black);
      expect(await color("cyan")).toBe(black);
      await expect(page.getByText("underline", { exact: true })).toHaveCSS(
        "text-decoration-line",
        "underline",
      );
      await expect(page.getByText("bold", { exact: true })).toHaveCSS(
        "font-weight",
        "600",
      );
    });
  });
});

test.describe("WebTerminal docked", () => {
  test("fills a pane of a vertical Splitter and maximizes into it", async ({
    page,
  }) => {
    await page.goto("/web-terminal-docked.html");
    const terminal = page.getByTestId("terminal");
    await expect(terminal).toBeVisible();
    const pane = await page.locator("#app [data-testid=host]").boundingBox();
    const box = await terminal.boundingBox();
    expect(box && pane && box.height < pane.height * 0.6).toBe(true);
    expect(box && box.height).toBeGreaterThan(120);

    await page.getByRole("button", { name: "Maximize" }).click();

    await expect(page.getByTestId("maximized")).toHaveText("true");
    await expect
      .poll(async () => (await terminal.boundingBox())?.height ?? 0)
      .toBeGreaterThan(pane ? pane.height - 8 : 400);
    await page.getByRole("button", { name: "Restore" }).click();
    await expect
      .poll(async () => (await terminal.boundingBox())?.height ?? 0)
      .toBeLessThan(pane ? pane.height * 0.6 : 0);
  });

  test("resizes with the keyboard and keeps the prompt visible", async ({
    page,
  }) => {
    await page.goto("/web-terminal-docked.html");
    const separator = page.getByRole("separator", { name: "Resize terminal" });
    await separator.focus();
    const before = await page.getByTestId("terminal").boundingBox();

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await expect
      .poll(
        async () =>
          (await page.getByTestId("terminal").boundingBox())?.height ?? 0,
      )
      .toBeGreaterThan((before?.height ?? 0) + 4);
    await expect(input(page)).toBeInViewport();
  });
});
