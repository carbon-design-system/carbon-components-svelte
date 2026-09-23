import { expect, test } from "@playwright/test";

test.describe("Data visualization", () => {
  test("viz tokens follow the theme", async ({ page }) => {
    await page.goto("/viz.html");
    const token = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--cds-viz-cat-01")
          .trim(),
      );

    expect(await token()).toBe("#6929c4");
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    expect(await token()).toBe("#8a3ffc");
  });

  test("FunnelBars sizes bars from the stage values", async ({ page }) => {
    await page.goto("/viz.html");
    const table = page.getByRole("table", {
      name: /Signup funnel, last 30 days/,
    });
    const widths = await table
      .locator(".bx--viz-funnel-bars__bar")
      .evaluateAll((bars) =>
        bars.map((bar) => bar.getBoundingClientRect().width),
      );

    expect(widths).toHaveLength(4);
    expect(widths[1] / widths[0]).toBeCloseTo(0.6, 1);
    expect(widths[3] / widths[0]).toBeCloseTo(0.09, 1);
  });

  test("StackedBar sizes segments by share and dims the rest on selection", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const bar = page.getByTestId("stacked-bar");
    const segments = bar.getByRole("button");
    const widths = await segments.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().width),
    );

    // 10000 : 6000 : 3000 : 900
    expect(widths[1] / widths[0]).toBeCloseTo(0.6, 1);
    expect(widths[2] / widths[0]).toBeCloseTo(0.3, 1);

    await segments.nth(1).click();
    await expect(segments.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(segments.nth(0)).toHaveCSS("opacity", "0.3");
    await expect(segments.nth(1)).toHaveCSS("opacity", "1");
  });

  test("selectable FunnelBars is one tab stop with arrow key navigation", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const funnel = page.getByTestId("selectable-funnel");

    await funnel.getByRole("button", { name: "Activated" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(funnel.getByRole("button", { name: "Paid" })).toBeFocused();
    await expect(page.getByTestId("selected")).toHaveText("activate");

    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected")).toHaveText("paid");
    await expect(funnel.getByRole("button", { name: "Paid" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await funnel.getByRole("row", { name: /Signup/ }).click();
    await expect(page.getByTestId("selected")).toHaveText("signup");
  });

  test("horizontal BarChart lays bars on their side and follows the pointer down the plot", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const figure = page
      .locator("figure")
      .filter({ hasText: "Users by stage" })
      .first();
    const bars = figure.locator(".bx--viz-bars__bar");
    await expect(bars).toHaveCount(4);

    const boxes = await bars.evaluateAll((nodes) =>
      nodes.map((node) => {
        const { width, height, top } = node.getBoundingClientRect();
        return { width, height, top };
      }),
    );
    expect(boxes[0].width).toBeGreaterThan(boxes[0].height);
    // 10000 then 6000, top to bottom.
    expect(boxes[1].width / boxes[0].width).toBeCloseTo(0.6, 1);
    expect(boxes[1].top).toBeGreaterThan(boxes[0].top);

    await bars.nth(2).hover();
    await expect(figure.locator(".bx--viz-chart-tooltip")).toContainText(
      "Activated",
    );
  });

  test("ScatterChart hovers the nearest point in both directions", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const figure = page
      .locator("figure")
      .filter({ hasText: "Revenue by month, as bubbles" })
      .first();
    const points = figure.locator(".bx--viz-points__point");
    await expect(points).toHaveCount(36);

    // Aim just beside a bubble: the chart, not the circle, finds it.
    await figure.scrollIntoViewIfNeeded();
    const box = await points.last().boundingBox();
    if (!box) throw new Error("no point");
    await page.mouse.move(box.x + box.width / 2 + 3, box.y + box.height / 2);
    await expect(figure.locator(".bx--viz-points__point--active")).toHaveCount(
      1,
    );
    await expect(figure.locator(".bx--viz-chart-tooltip")).toContainText(
      "Month",
    );

    // Far from every point, nothing is hovered.
    const plot = await figure.locator("svg").first().boundingBox();
    if (!plot) throw new Error("no plot");
    await page.mouse.move(plot.x + 2, plot.y + 2);
    await expect(figure.locator(".bx--viz-points__point--active")).toHaveCount(
      0,
    );
  });

  test("LineChart follows its container and shows a tooltip for the focused point", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const chart = page.getByRole("application", { name: "Revenue by region" });

    // The nominal server width is replaced by the measured one.
    await expect
      .poll(async () => (await chart.getAttribute("viewBox")) ?? "")
      .not.toBe("0 0 640 288");
    const box = await chart.boundingBox();
    expect((await chart.getAttribute("viewBox")) ?? "").toBe(
      `0 0 ${Math.round(box?.width ?? 0)} 288`,
    );

    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const tooltip = page.locator(".bx--viz-chart-tooltip");
    await expect(tooltip).toContainText("Feb 1, 2026");
    await expect(tooltip).toContainText("EMEA");

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
  });

  test("LineChart dashes the projected tail and names each anomaly", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const figure = page.locator("figure", {
      has: page.getByRole("application", { name: "Revenue, projected" }),
    });
    await figure.scrollIntoViewIfNeeded();

    const lines = figure.locator(".bx--viz-line__path");
    await expect(lines).toHaveCount(2);
    await expect(lines.nth(1)).toHaveClass(/--dashed/);
    // The dashes come from CSS, not an attribute.
    await expect
      .poll(() =>
        lines.nth(1).evaluate((node) => getComputedStyle(node).strokeDasharray),
      )
      .not.toBe("none");

    await expect(figure.locator(".bx--viz-band__fill")).toHaveCount(1);
    await expect(figure.getByText("Today")).toBeVisible();
    await expect(
      figure.getByRole("img", { name: /^Anomaly: Apr 1, 2026/ }),
    ).toHaveCount(1);
  });

  test("LineChart swaps to a data table and back from its toolbar", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    // By caption: the chart surface leaves the accessibility tree while the
    // table is showing.
    const figure = page
      .getByRole("figure")
      .filter({ hasText: "Revenue by region" });

    await figure.getByRole("button", { name: "Show as table" }).click();
    const table = page.getByRole("region", {
      name: "Revenue by region, data table",
    });
    await expect(table.getByRole("columnheader")).toHaveText([
      "Date",
      "EMEA",
      "APAC",
      "AMER",
    ]);
    await expect(table.getByRole("rowheader").first()).toHaveText(
      "Jan 1, 2026",
    );
    await expect(
      page.getByRole("application", { name: "Revenue by region" }),
    ).toBeHidden();

    await figure.getByRole("button", { name: "Show as chart" }).click();
    await expect(table).toHaveCount(0);
  });

  test("LineChart downloads its plot as a PNG", async ({ page }) => {
    await page.goto("/viz.html");
    const figure = page
      .locator("figure")
      .filter({ hasText: "Revenue by region" })
      .last();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      figure.getByRole("button", { name: "Download as image" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("chart.png");

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const file = Buffer.concat(chunks);
    // A PNG signature, and enough bytes to hold more than a blank canvas.
    expect(file.subarray(1, 4).toString()).toBe("PNG");
    expect(file.length).toBeGreaterThan(5000);
  });

  test("a painted ScatterChart draws its points on a canvas, hovers one as an element, and exports them in the image", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const figure = page
      .locator("figure")
      .filter({ hasText: "Painted points" })
      .last();
    await figure.scrollIntoViewIfNeeded();
    const canvas = figure.locator("canvas");
    await expect(canvas).toBeVisible();
    // The pixels are there, the elements are not.
    await expect
      .poll(() =>
        canvas.evaluate((node) => {
          const el = node as HTMLCanvasElement;
          const data = el
            .getContext("2d")
            ?.getImageData(0, 0, el.width, el.height).data;
          if (!data) return 0;
          let painted = 0;
          for (let i = 3; i < data.length; i += 4)
            if (data[i] > 0) painted += 1;
          return painted;
        }),
      )
      .toBeGreaterThan(1000);
    await expect(figure.locator(".bx--viz-points__point")).toHaveCount(0);

    const svg = figure.getByRole("application");
    await svg.focus();
    await page.keyboard.press("ArrowRight");
    await expect(figure.locator(".bx--viz-points__point--active")).toHaveCount(
      1,
    );
    await expect(canvas).toHaveClass(/bx--viz-chart__canvas--dimmed/);
    await expect(figure.locator(".bx--viz-chart-tooltip")).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      figure.getByRole("button", { name: "Download as image" }).click(),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const file = Buffer.concat(chunks);
    expect(file.subarray(1, 4).toString()).toBe("PNG");
    // Painted points make the image far larger than an empty plot.
    expect(file.length).toBeGreaterThan(20000);
  });

  test("NodeEditor moves a node by dragging it and connects two nodes by dragging from a port", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const figure = page
      .locator("figure")
      .filter({ hasText: "Pipeline editor" })
      .last();
    await figure.scrollIntoViewIfNeeded();
    type Box = { x: number; y: number; width: number; height: number };
    const boxOf = async (target: typeof figure) =>
      (await target.boundingBox()) as Box;
    const map = figure.locator(".bx--viz-editor__node", { hasText: "map" });
    const before = await boxOf(map);
    const grab = {
      x: before.x + before.width / 2,
      y: before.y + before.height / 2,
    };
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 40, grab.y + 30, { steps: 6 });
    await page.mouse.move(grab.x + 80, grab.y + 40, { steps: 4 });
    await page.mouse.up();
    const after = await boxOf(map);
    expect(after.x - before.x).toBeGreaterThan(50);
    expect(after.y - before.y).toBeGreaterThan(20);
    await expect(figure.locator(".bx--viz-editor__edge")).toHaveCount(1);

    // Drag from map's out port onto sink.
    const port = map.locator(".bx--viz-editor__port--out");
    const sink = figure.locator(".bx--viz-editor__node", { hasText: "sink" });
    const from = await boxOf(port);
    const to = await boxOf(sink);
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
      steps: 8,
    });
    await expect(figure.locator(".bx--viz-editor__link")).toBeVisible();
    await page.mouse.up();
    await expect(figure.locator(".bx--viz-editor__edge")).toHaveCount(2);
    await expect(figure.locator("[aria-live]")).toHaveText(
      /connected map to sink/,
    );

    // Undo from the control puts the edge back where it was: gone.
    await figure.getByRole("button", { name: "Undo" }).click();
    await expect(figure.locator(".bx--viz-editor__edge")).toHaveCount(1);
  });

  test("LineChart zooms by dragging a handle, pans by dragging the window, and resets", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const figure = page
      .locator("figure")
      .filter({ hasText: "Revenue by region" })
      .last();
    await figure.scrollIntoViewIfNeeded();
    const start = figure.getByRole("slider", { name: "Range start" });
    const end = figure.getByRole("slider", { name: "Range end" });
    const track = await figure.locator(".bx--viz-zoom__track").boundingBox();
    if (!track) throw new Error("no track");
    const y = track.y + track.height / 2;
    const before = Number(await start.getAttribute("aria-valuenow"));

    // Drag the start handle to the middle.
    await page.mouse.move(track.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width / 2, y, { steps: 5 });
    await page.mouse.up();
    const zoomed = Number(await start.getAttribute("aria-valuenow"));
    expect(zoomed).toBeGreaterThan(before);
    await expect(figure.locator(".bx--viz-line")).toHaveAttribute(
      "clip-path",
      /url\(#bx-viz-clip-/,
    );

    // Drag the window left: both ends move, and the width holds.
    const width = Number(await end.getAttribute("aria-valuenow")) - zoomed;
    await page.mouse.move(track.x + track.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width * 0.5, y, { steps: 5 });
    await page.mouse.up();
    const panned = Number(await start.getAttribute("aria-valuenow"));
    expect(panned).toBeLessThan(zoomed);
    expect(
      Number(await end.getAttribute("aria-valuenow")) - panned,
    ).toBeCloseTo(width, -3);

    await figure.getByRole("button", { name: "Reset zoom" }).click();
    await expect(start).toHaveAttribute("aria-valuenow", String(before));
  });
});
