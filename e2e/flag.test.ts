import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const SIZES = [16, 20, 24, 32];

/** The rgb of the pixel at (x, y) of a screenshot of an element. */
async function pixelOf(page: Page, flag: Locator, x: number, y: number) {
  const png = (await flag.screenshot()).toString("base64");
  return page.evaluate(
    async ([png, x, y]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context?.drawImage(image, 0, 0);
      const [r, g, b] = context?.getImageData(x, y, 1, 1).data ?? [];
      return `rgb(${r}, ${g}, ${b})`;
    },
    [png, x, y] as const,
  );
}

test.describe("Flag", () => {
  test("draws each size as a 4:3 box, with the code box the same size", async ({
    page,
  }) => {
    await page.goto("/flag.html");

    for (const size of SIZES) {
      for (const testid of [`flag-JP-${size}`, `badge-${size}`]) {
        // biome-ignore lint/performance/noAwaitInLoops: one box at a time
        const box = await page.getByTestId(testid).boundingBox();
        expect(box?.width, testid).toBe(size);
        expect(box?.height, testid).toBe((size * 3) / 4);
      }
    }
  });

  test("fills the whole frame, and nothing outside it, for every flag", async ({
    page,
  }) => {
    await page.goto("/flag.html");

    const problems = await page.evaluate(() =>
      [...document.querySelectorAll<SVGSVGElement>("[data-flag]")].flatMap(
        (svg) => {
          const box = svg.getBBox();
          // The group is the flag's art: its bounds are the frame exactly.
          const inFrame =
            Math.abs(box.x) < 0.01 &&
            Math.abs(box.y) < 0.01 &&
            Math.abs(box.width - 32) < 0.01 &&
            Math.abs(box.height - 24) < 0.01;
          return inFrame
            ? []
            : [
                `${svg.dataset.flag}: ${box.x},${box.y} ${box.width}x${box.height}`,
              ];
        },
      ),
    );

    expect(problems).toEqual([]);
    expect(await page.locator("[data-flag]").count()).toBeGreaterThan(90);
  });

  test("outlines a flag inside its box with a theme token", async ({
    page,
  }) => {
    await page.goto("/flag.html");
    const outline = () =>
      page.getByTestId("flag-JP-32").evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          color: style.outlineColor,
        };
      });
    const white = await outline();

    await page.goto("/flag.html?theme=g100");
    const dark = await outline();

    expect(white).toMatchObject({
      style: "solid",
      width: "1px",
      offset: "-1px",
    });
    expect(dark).toMatchObject({
      style: "solid",
      width: "1px",
      offset: "-1px",
    });
    // The keyline follows the theme.
    expect(dark.color).not.toBe(white.color);
  });

  test("does not mirror under right-to-left", async ({ page }) => {
    // Flags are not directional, so an asymmetric one must look the same.
    const shots: Record<string, Buffer[]> = { ltr: [], rtl: [] };
    for (const dir of ["ltr", "rtl"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await page.goto(`/flag.html?dir=${dir}`);
      for (const code of ["US", "ZA", "PK", "GB"]) {
        shots[dir].push(
          // biome-ignore lint/performance/noAwaitInLoops: one flag at a time
          await page.getByTestId(`flag-${code}-32`).screenshot(),
        );
      }
    }

    for (const [i, shot] of shots.ltr.entries()) {
      expect(shot.equals(shots.rtl[i])).toBe(true);
    }
  });

  test("keeps its colors under forced colors, with a CanvasText outline", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/flag.html");
    const france = page.getByTestId("flag-FR-32");

    // France's first third is blue, and stays blue, not ButtonText.
    expect(await pixelOf(page, france, 6, 12)).toBe("rgb(0, 83, 154)");
    const canvasText = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(
      await france.evaluate((el) => getComputedStyle(el).outlineColor),
    ).toBe(canvasText);
  });

  test("passes axe on White, Gray 100 and RTL", async ({ page }) => {
    for (const query of ["", "theme=g100", "dir=rtl"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
      await page.goto(`/flag.html?${query}`);
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations, query).toEqual([]);
    }
  });

  test("names a flag only when given a title", async ({ page }) => {
    await page.goto("/flag.html");

    await expect(page.getByRole("img", { name: "Norway" })).toHaveCount(1);
    // Every other flag and code box is decoration: not in the tree.
    await expect(page.getByRole("img")).toHaveCount(1);
  });
});
