import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** The key `mod` means to the component: Command on Apple platforms, else Control. */
const modKey = (page: Page) =>
  page.evaluate(() =>
    /Mac|iPhone|iPad|iPod/.test(
      (navigator as unknown as { userAgentData?: { platform?: string } })
        .userAgentData?.platform ||
        navigator.platform ||
        navigator.userAgent,
    )
      ? "Meta"
      : "Control",
  );

const root = (page: Page) => page.getByTestId("merge");
const actions = (page: Page) =>
  root(page).getByRole("group", { name: "Conflict actions" });
const result = (page: Page) => page.getByRole("textbox", { name: "Result" });
const summary = (page: Page) => page.locator(".bx--merge-resolver__status");

/** Every pane's scroller: ours, the result's textarea, then theirs. */
const scrollTops = (page: Page) =>
  page.evaluate(() => {
    const [ours, theirs] = [
      ...document.querySelectorAll<HTMLElement>(
        ".bx--merge-resolver__scroller",
      ),
    ];
    const area = document.querySelector<HTMLTextAreaElement>("textarea");
    return {
      ours: ours.scrollTop,
      result: area?.scrollTop ?? 0,
      theirs: theirs.scrollTop,
    };
  });

/** The number in the first `key_N` row that sits fully in view in each pane. */
const firstKeys = (page: Page) =>
  page.evaluate(() => {
    const read = (pane: Element, scroller: Element) => {
      const top = scroller.getBoundingClientRect().top;
      for (const row of pane.querySelectorAll(".bx--merge-resolver__code")) {
        const match = row.textContent?.match(/^key_(\d+)/);
        if (match && row.getBoundingClientRect().top >= top - 1) {
          return Number(match[1]);
        }
      }
      return -1;
    };
    const panes = [...document.querySelectorAll(".bx--merge-resolver__pane")];
    return panes.map((pane) =>
      read(
        pane,
        pane.querySelector(
          ".bx--merge-resolver__scroller, textarea",
        ) as Element,
      ),
    );
  });

test.describe("MergeResolver", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  test("lays out ours, the result and theirs in columns, then stacks, then tabs", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html");
    const boxes = async () =>
      (
        await Promise.all(
          [
            ".bx--merge-resolver__pane--ours",
            ".bx--merge-resolver__pane--result",
            ".bx--merge-resolver__pane--theirs",
          ].map((selector) => page.locator(selector).boundingBox()),
        )
      ).map((box) => box);

    const [ours, mid, theirs] = await boxes();
    expect(ours?.x).toBeLessThan(mid?.x ?? 0);
    expect(mid?.x).toBeLessThan(theirs?.x ?? 0);
    expect(Math.abs((ours?.y ?? 0) - (theirs?.y ?? 1))).toBeLessThan(1);

    await page.setViewportSize({ width: 900, height: 900 });
    await expect(root(page)).toHaveClass(/bx--merge-resolver--stacked/);
    const [top, bottom] = await boxes();
    expect(bottom?.y).toBeGreaterThan(top?.y ?? 0);

    await page.setViewportSize({ width: 500, height: 900 });
    await expect(root(page)).toHaveClass(/bx--merge-resolver--tabs/);
    await expect(page.locator(".bx--merge-resolver__pane--ours")).toBeHidden();
    const tabs = root(page).getByRole("group", { name: "Pane" });
    await tabs.getByRole("button", { name: "Ours" }).click();
    await expect(page.locator(".bx--merge-resolver__pane--ours")).toBeVisible();
    await expect(
      page.locator(".bx--merge-resolver__pane--result"),
    ).toBeHidden();
    await expect(tabs.getByRole("button", { name: "Ours" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("moves between conflicts with F7 and lines each one up across the panes", async ({
    page,
  }) => {
    // The 10,000 line file, so no pane is stopped by the end of its content.
    await page.goto("/merge-resolver.html?stress");
    await result(page).focus();
    await expect(summary(page)).toContainText("Conflict 1 of 50");

    for (const [key, label] of [
      ["F7", "Conflict 2 of 50"],
      ["F7", "Conflict 3 of 50"],
      ["Shift+F7", "Conflict 2 of 50"],
      ["Shift+F7", "Conflict 1 of 50"],
      ["Shift+F7", "Conflict 50 of 50"],
      ["F7", "Conflict 1 of 50"],
    ] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: each move must land before the next is judged
      await page.keyboard.press(key);
      await expect(summary(page)).toContainText(label);
      await expect(page.getByRole("status")).toHaveText(
        new RegExp(`${label}: unresolved`),
      );
      const heads = page.locator(
        '.bx--merge-resolver__head[aria-current="true"]',
      );
      await expect(heads).toHaveCount(2);
      const oursHead = await heads.nth(0).boundingBox();
      const theirsHead = await heads.nth(1).boundingBox();
      const firstMarker = await page
        .locator(
          ".bx--merge-resolver__pane--result .bx--merge-resolver__row--current",
        )
        .first()
        .boundingBox();
      if (label !== "Conflict 1 of 50") {
        expect(
          Math.abs((oursHead?.y ?? 0) - (firstMarker?.y ?? 99)),
        ).toBeLessThan(3);
        expect(
          Math.abs((theirsHead?.y ?? 0) - (firstMarker?.y ?? 99)),
        ).toBeLessThan(3);
      }
    }
  });

  test("accepts each choice for the current conflict and undoes it", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html");
    const text = () => page.getByTestId("result").textContent();
    const original = await text();

    await actions(page).getByRole("button", { name: "Accept theirs" }).click();
    await expect(summary(page)).toContainText("2 conflicts remaining");
    expect(await text()).toContain("replicas: 3");
    await expect(result(page)).toHaveValue((await text()) ?? "");

    await page.keyboard.press(`${await modKey(page)}+z`);
    expect(await text()).toBe(original);
    await expect(summary(page)).toContainText("3 conflicts remaining");

    await actions(page).getByRole("button", { name: "Accept both" }).click();
    expect(await text()).toContain(
      "replicas: 4\n  image: registry.example.com/checkout:1.4.0\n  replicas: 3",
    );
    await actions(page).getByRole("button", { name: "Undo" }).click();
    expect(await text()).toBe(original);
    await actions(page).getByRole("button", { name: "Redo" }).click();
    expect(await text()).toContain("replicas: 3");
  });

  test("keeps a conflict in place while the text around it is typed over", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html");
    await result(page).click();
    await result(page).evaluate((area) => area.setSelectionRange(0, 0));
    await page.keyboard.type("# added by hand\nand another\n");
    await expect(summary(page)).toContainText("3 conflicts remaining");

    await page.keyboard.press("F7");
    await page.keyboard.press("Alt+KeyT");
    const text = (await page.getByTestId("result").textContent()) ?? "";
    expect(text.startsWith("# added by hand\nand another\n# Service")).toBe(
      true,
    );
    expect(text).toContain("replicas: 3");
    expect(text).toContain("<<<<<<<");
  });

  test("resolves every conflict of a 10,000 line file by keyboard alone", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/merge-resolver.html?stress");
    await expect(summary(page)).toContainText("50 conflicts remaining");
    await result(page).focus();

    for (let i = 0; i < 50; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: one key press at a time
      await page.keyboard.press(i % 2 ? "Alt+KeyT" : "Alt+KeyO");
    }
    await expect(summary(page)).toContainText("All conflicts resolved");
    await expect(page.getByRole("status")).toContainText(
      "All conflicts resolved",
    );

    await page.keyboard.press(`${await modKey(page)}+Enter`);
    await expect(page.getByTestId("resolved")).toHaveText("1");
    const text = (await page.getByTestId("result").textContent()) ?? "";
    expect(text).not.toContain("<<<<<<<");
    expect(text).toContain("key_10: ours_0");
    expect(text).toContain("key_210: theirs_1");
    expect(text).toContain("key_110: only_ours_0");
  });

  test("lets a handler cancel resolve", async ({ page }) => {
    await page.goto("/merge-resolver.html?cancel");
    await result(page).focus();
    for (let i = 0; i < 3; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: one key press at a time
      await page.keyboard.press("Alt+KeyO");
    }
    await page.keyboard.press(`${await modKey(page)}+Enter`);
    await expect(page.getByTestId("canceled")).toHaveText("1");
    await expect(
      actions(page).getByRole("button", { name: "Mark as resolved" }),
    ).toBeEnabled();
  });

  test("carries a scroll in any pane to the same place in the others", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html?stress");
    await expect(summary(page)).toContainText("50 conflicts remaining");

    await result(page).evaluate((area) => {
      area.scrollTop = 120_000;
    });
    const apart = async () => {
      const [ours, mid, theirs] = await firstKeys(page);
      return Math.max(Math.abs(ours - mid), Math.abs(theirs - mid));
    };
    await expect
      .poll(async () => (await firstKeys(page))[1])
      .toBeGreaterThan(5000);
    await expect.poll(apart).toBeLessThan(80);

    await page
      .locator(".bx--merge-resolver__scroller")
      .first()
      .evaluate((el) => {
        el.scrollTop = 40_000;
      });
    await expect
      .poll(async () => (await scrollTops(page)).result)
      .toBeLessThan(60_000);
    await expect.poll(apart).toBeLessThan(80);
    expect((await firstKeys(page))[1]).toBeLessThan(2500);

    await page
      .locator(".bx--merge-resolver__scroller")
      .nth(1)
      .evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
    await expect
      .poll(async () => {
        const tops = await scrollTops(page);
        return Math.abs(tops.ours - tops.theirs);
      })
      .toBeLessThan(2);
    const max = await result(page).evaluate(
      (area) => area.scrollHeight - area.clientHeight,
    );
    expect((await scrollTops(page)).result).toBeGreaterThan(max - 200);
  });

  test("paints a window of rows that does not grow with the file", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html?stress&height=40rem");
    await expect(summary(page)).toContainText("50 conflicts remaining");
    const rows = await page.locator(".bx--merge-resolver__row").count();
    expect(rows).toBeLessThan(400);

    const frames = await result(page).evaluate(
      (area) =>
        new Promise<number[]>((resolve) => {
          const times: number[] = [];
          let last = performance.now();
          let steps = 0;
          const frame = (now: number) => {
            times.push(now - last);
            last = now;
            area.scrollTop += 700;
            if (++steps < 90) requestAnimationFrame(frame);
            else resolve(times.slice(5).sort((a, b) => a - b));
          };
          requestAnimationFrame(frame);
        }),
    );
    const p95 = frames[Math.floor(frames.length * 0.95)];
    test.info().annotations.push({
      type: "scroll frames",
      description: `p50 ${frames[Math.floor(frames.length / 2)].toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`,
    });
    expect(p95).toBeLessThan(100);
    await expect(
      page.locator(".bx--merge-resolver__row").first(),
    ).toBeVisible();
  });

  test("keeps rows one line high and scrolls sideways for very long lines", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html?stress&long");
    await expect(summary(page)).toContainText("50 conflicts remaining");
    const heights = await page
      .locator(".bx--merge-resolver__pane--ours .bx--merge-resolver__row")
      .evaluateAll((rows) =>
        rows.map((row) => row.getBoundingClientRect().height),
      );
    expect(new Set(heights.map((height) => Math.round(height))).size).toBe(1);

    const scroller = page.locator(".bx--merge-resolver__scroller").first();
    expect(
      await scroller.evaluate((el) => el.scrollWidth > el.clientWidth * 10),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("keeps CRLF line endings in the result", async ({ page }) => {
    await page.goto("/merge-resolver.html?crlf");
    await result(page).focus();
    for (let i = 0; i < 3; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: one key press at a time
      await page.keyboard.press("Alt+KeyT");
    }
    const text = (await page.getByTestId("result").textContent()) ?? "";
    expect(text).toContain("\r\n");
    expect(text.replace(/\r\n/g, "")).not.toContain("\n");
    expect(text).not.toContain("<<<<<<<");
  });

  test("reads one file with conflict markers", async ({ page }) => {
    await page.goto("/merge-resolver.html?markers");
    await expect(summary(page)).toContainText("1 conflict remaining");
    await expect(
      actions(page).getByRole("button", { name: "Accept base" }),
    ).toBeDisabled();
    await actions(page).getByRole("button", { name: "Accept theirs" }).click();
    await expect(page.getByTestId("result")).toHaveText(
      "service:\n  replicas: 2\n  image: app:1.5.0\n  tls: true\n",
    );
  });

  test("names the textbox and each conflict and passes axe in white and Gray 100", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html");
    await expect(result(page)).toBeVisible();
    await expect(
      root(page).getByRole("group", { name: "Conflict 1 of 3: unresolved" }),
    ).toHaveCount(2);

    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    await page.addStyleTag({ content: "* { transition: none !important; }" });
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    const dark = await new AxeBuilder({ page }).include("#app").analyze();
    expect(dark.violations).toEqual([]);
  });

  test("keeps code left to right and mirrors the chrome in RTL", async ({
    page,
  }) => {
    await page.goto("/merge-resolver.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );

    const x = async (selector: string) =>
      (await page.locator(selector).first().boundingBox())?.x ?? 0;
    expect(await x(".bx--merge-resolver__pane--ours")).toBeGreaterThan(
      await x(".bx--merge-resolver__pane--theirs"),
    );
    expect(
      await page.evaluate(() => {
        const read = (selector: string) =>
          getComputedStyle(document.querySelector(selector) as Element)
            .direction;
        return [
          read("textarea"),
          read(".bx--merge-resolver__scroller"),
          read(".bx--merge-resolver__row"),
          read(".bx--merge-resolver__toolbar"),
        ];
      }),
    ).toEqual(["ltr", "ltr", "ltr", "rtl"]);
    const first = await actions(page).getByRole("button").first().boundingBox();
    const last = await actions(page).getByRole("button").last().boundingBox();
    expect(first?.x).toBeGreaterThan(last?.x ?? 0);
  });

  test("keeps a cue other than color for each state under forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/merge-resolver.html");
    await expect(result(page)).toBeVisible();

    const cues = await page.evaluate(() => {
      const edge = (selector: string) => {
        const row = document.querySelector(selector) as Element;
        const style = getComputedStyle(row, "::after");
        return [style.borderInlineStartStyle, style.borderInlineStartWidth];
      };
      const sign = (selector: string) =>
        document.querySelector(`${selector} .bx--merge-resolver__sign`)
          ?.textContent;
      return {
        conflict: edge(
          ".bx--merge-resolver__pane--ours .bx--merge-resolver__row--conflict",
        ),
        changed: edge(
          ".bx--merge-resolver__pane--ours .bx--merge-resolver__row--changed",
        ),
        conflictSign: sign(
          ".bx--merge-resolver__pane--ours .bx--merge-resolver__row--conflict",
        ),
        changedSign: sign(
          ".bx--merge-resolver__pane--ours .bx--merge-resolver__row--changed",
        ),
        textareaColor: getComputedStyle(
          document.querySelector("textarea") as Element,
        ).color,
      };
    });
    expect(cues.conflict).toEqual(["double", "4px"]);
    expect(cues.changed).toEqual(["dotted", "4px"]);
    expect(cues.conflictSign).toBe("!");
    expect(cues.changedSign).toBe("~");
    // The textarea keeps its text transparent so the rows' copy shows once.
    expect(cues.textareaColor).toBe("rgba(0, 0, 0, 0)");

    await actions(page).getByRole("button", { name: "Accept ours" }).click();
    const resolved = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector(
            ".bx--merge-resolver__row--resolved",
          ) as Element,
          "::after",
        ).borderInlineStartStyle,
    );
    expect(resolved).toBe("solid");
    await expect(
      page.locator(".bx--merge-resolver__head--current").first(),
    ).toHaveCSS("border-top-width", "3px");
  });
});
