import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { encodeQR } from "../src/QRCode/qr-encode.js";
import { decodeGrid, decodeLuma } from "../tests/QRCode/decoder";
import { expect, test } from "./helpers/host";

const OTP =
  "otpauth://totp/Acme:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme";

const CODES = [
  {
    id: "qr-default",
    value: "https://example.com/devices/pair?code=482913",
    ecc: "M",
  },
  { id: "qr-disclosure", value: OTP, ecc: "M" },
  { id: "qr-logo", value: OTP, ecc: "H" },
  { id: "qr-emoji", value: "WIFI:T:WPA;S:Café ☕ 你好;P:pässwörd;;", ecc: "Q" },
] as const;

/** The block layout of the clean symbol, for a code with a logo over it. */
function structureOf(value: string, ecc: "L" | "M" | "Q" | "H") {
  const qr = encodeQR(value, ecc);
  const grid = Array.from({ length: qr.size }, (_, y) =>
    Array.from(qr.modules.slice(y * qr.size, (y + 1) * qr.size)),
  );
  return decodeGrid(grid).structure;
}

/**
 * Screenshot the symbol and read its pixels back through a canvas, the way a
 * camera pipeline sees them: PNG to canvas to luma.
 */
async function luma(page: Page, id: string) {
  const png = await page
    .locator(`[data-testid=${id}] .bx--qr-code__symbol`)
    .screenshot();
  return page.evaluate(
    async ([b64, dpr]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.drawImage(img, 0, 0);
      // A fractional layout offset lets the screenshot take a pixel row of the
      // page behind the tile, which is dark in Gray 100. Crop inside the quiet
      // zone, which is many pixels wide.
      const inset = 3 * dpr;
      const width = canvas.width - inset * 2;
      const height = canvas.height - inset * 2;
      const { data } = ctx.getImageData(inset, inset, width, height);
      const out: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        out.push(
          Math.round(
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
          ),
        );
      }
      return { width, height, luma: out };
    },
    [
      png.toString("base64"),
      await page.evaluate(() => window.devicePixelRatio),
    ] as const,
  );
}

async function expectScans(page: Page, id: string) {
  const code = CODES.find((c) => c.id === id);
  if (!code) throw new Error(id);
  const { width, height, luma: pixels } = await luma(page, id);
  const { decoded } = decodeLuma(pixels, width, height, {
    structure: id === "qr-logo" ? structureOf(code.value, code.ecc) : undefined,
  });
  expect(decoded.text).toBe(code.value);
  expect(decoded.ecc).toBe(code.ecc);
  return decoded;
}

test.describe("QRCode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/qr-code.html");
    await expect(page.getByTestId("qr-default")).toBeVisible();
  });

  for (const theme of ["white", "g100"]) {
    test(`has no accessibility violations in ${theme}`, async ({ page }) => {
      await page.evaluate(
        (theme) => document.documentElement.setAttribute("theme", theme),
        theme,
      );
      await page
        .getByRole("button", { name: "Can't scan? Enter this key" })
        .click();
      // Axe reads colors, which are mid-fade while the disclosure opens.
      await expect(page.locator(".bx--disclosure--expanding")).toHaveCount(0);

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("names each image by purpose and describes it with the text", async ({
    page,
  }) => {
    const images = page.getByRole("img");
    await expect(images).toHaveCount(5);
    await expect(
      page.getByRole("img", { name: "Scan to pair this device" }),
    ).toHaveAccessibleDescription(CODES[0].value);
    await expect(
      page.getByRole("img", {
        name: "Scan to set up two-factor authentication",
      }),
    ).toHaveAccessibleDescription(/JBSW Y3DP EHPK 3PXP/);
    // Never the encoded data as the name.
    for (const name of await images.evaluateAll((els) =>
      els.map((el) => el.getAttribute("aria-label")),
    )) {
      expect(name).not.toMatch(/https?:|otpauth:|WIFI:/);
    }
  });

  test("keeps a text alternative for every code", async ({ page }) => {
    await expect(
      page
        .getByTestId("qr-default")
        .getByRole("button", { name: "Copy to clipboard" }),
    ).toBeVisible();
    // Behind a disclosure until it opens.
    const toggle = page.getByRole("button", {
      name: "Can't scan? Enter this key",
    });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(page.getByText("JBSW Y3DP EHPK 3PXP")).toBeVisible();
  });

  test.describe("scannability", () => {
    for (const code of CODES) {
      test(`${code.id} decodes at 1x`, async ({ page }) => {
        await expectScans(page, code.id);
      });
    }

    test("a logo is recovered from error correction", async ({ page }) => {
      const decoded = await expectScans(page, "qr-logo");

      expect(decoded.corrected).toBeGreaterThan(0);
    });

    for (const code of CODES) {
      test(`${code.id} decodes at 2x`, async ({ browser }, testInfo) => {
        const context = await browser.newContext({
          deviceScaleFactor: 2,
          baseURL: testInfo.project.use.baseURL,
        });
        const page = await context.newPage();
        await page.goto("/qr-code.html");
        await expectScans(page, code.id);
        await context.close();
      });
    }

    test("shrinks to a narrow parent and still decodes", async ({ page }) => {
      const box = await page
        .locator("[data-testid=qr-narrow] svg")
        .boundingBox();
      expect(box?.width).toBeLessThanOrEqual(120);

      const { width, height, luma: pixels } = await luma(page, "qr-narrow");
      const { decoded } = decodeLuma(pixels, width, height);

      expect(decoded.text).toBe("https://example.com/narrow");
    });
  });

  test.describe("themes", () => {
    test("is dark modules on a light tile in Gray 100", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("theme", "g100"),
      );

      const colors = await page.evaluate(() => {
        const svg = document.querySelector("[data-testid=qr-default] svg");
        const path = svg?.querySelector("path");
        if (!svg || !path) throw new Error("no svg");
        return {
          tile: getComputedStyle(svg).backgroundColor,
          modules: getComputedStyle(path).fill,
          page: getComputedStyle(document.body).backgroundColor,
        };
      });

      expect(colors.tile).toBe("rgb(255, 255, 255)");
      expect(colors.modules).toBe("rgb(0, 0, 0)");
      expect(colors.page).not.toBe(colors.tile);
      await expectScans(page, "qr-default");
      await expectScans(page, "qr-logo");
    });
  });

  test.describe("forced colors", () => {
    test.beforeEach(async ({ page }) => {
      // A dark palette, like Windows' "Night sky": Canvas is black.
      await page.emulateMedia({ forcedColors: "active", colorScheme: "dark" });
    });

    test.afterEach(async ({ page }) => {
      await page.emulateMedia({ forcedColors: "none", colorScheme: "light" });
    });

    test("keeps the tile and modules instead of system colors", async ({
      page,
    }) => {
      const read = () =>
        page.evaluate(() => {
          const svg = document.querySelector<SVGElement>(
            "[data-testid=qr-default] svg",
          );
          const path = svg?.querySelector("path");
          if (!svg || !path) throw new Error("no svg");
          return {
            adjust: getComputedStyle(svg).forcedColorAdjust,
            tile: getComputedStyle(svg).backgroundColor,
            modules: getComputedStyle(path).fill,
          };
        });

      const kept = await read();
      expect(kept).toEqual({
        adjust: "none",
        tile: "rgb(255, 255, 255)",
        modules: "rgb(0, 0, 0)",
      });
      for (const code of CODES) await expectScans(page, code.id);

      // Without the opt-out the tile takes Canvas, black here, and the black
      // modules (forced colors leave an SVG fill alone) vanish into it.
      await page.addStyleTag({
        content: ".bx--qr-code__svg { forced-color-adjust: auto; }",
      });
      const adjusted = await read();
      expect(adjusted.adjust).toBe("auto");
      expect(adjusted.tile).not.toBe("rgb(255, 255, 255)");
      expect(adjusted.modules).toBe("rgb(0, 0, 0)");
    });
  });

  test.describe("right-to-left", () => {
    test("never mirrors the code", async ({ page }) => {
      const before = await luma(page, "qr-default");
      const path = () =>
        page
          .locator("[data-testid=qr-default] .bx--qr-code__path")
          .getAttribute("d");
      const dLtr = await path();

      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      const after = await luma(page, "qr-default");

      expect(await path()).toBe(dLtr);
      expect(after.width).toBe(before.width);
      expect(after.luma).toEqual(before.luma);
      await expectScans(page, "qr-default");
      await expectScans(page, "qr-emoji");
    });

    test("keeps the logo centered", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });

      const offset = await page.evaluate(() => {
        const symbol = document
          .querySelector("[data-testid=qr-logo] .bx--qr-code__symbol")
          ?.getBoundingClientRect();
        const plate = document
          .querySelector("[data-testid=qr-logo] .bx--qr-code__logo-plate")
          ?.getBoundingClientRect();
        if (!symbol || !plate) throw new Error("no logo");
        return {
          x: plate.left + plate.width / 2 - (symbol.left + symbol.width / 2),
          y: plate.top + plate.height / 2 - (symbol.top + symbol.height / 2),
        };
      });

      expect(Math.abs(offset.x)).toBeLessThan(1);
      expect(Math.abs(offset.y)).toBeLessThan(1);
      await expectScans(page, "qr-logo");
    });
  });
});
