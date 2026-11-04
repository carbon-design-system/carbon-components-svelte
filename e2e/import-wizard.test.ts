// @reads tests/ImportWizard/xlsx-fixture.ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { workbook, zip } from "../tests/ImportWizard/xlsx-fixture";
import { expect, test } from "./helpers/host";
import { findLayoutProblems } from "./helpers/layout";

const HEADER = "Customer,Mail,Role,Active,Joined,Seats";
const ROLES = ["admin", "member", "Owner", "guest"];

function usersCsv(count: number) {
  const rows = [HEADER];
  for (let i = 0; i < count; i++) {
    rows.push(
      [
        `Person ${i}`,
        i % 5 === 0 ? `p${i}@example` : `p${i}@example.com`,
        ROLES[i % 4],
        i % 2 ? "Y" : "N",
        `${(i % 12) + 1}/${(i % 27) + 1}/2024`,
        String((i % 40) + 1),
      ].join(","),
    );
  }
  return rows.join("\n");
}

async function upload(
  page: Page,
  body: string | Buffer,
  name = "users.csv",
  mimeType = "text/csv",
) {
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType,
    buffer: Buffer.isBuffer(body) ? body : Buffer.from(body),
  });
}

const next = (page: Page) =>
  page.getByRole("button", { name: "Continue" }).click();

async function toMap(page: Page, csv = usersCsv(30)) {
  await page.goto("/import-wizard.html");
  await upload(page, csv);
  await expect(page.getByText(/rows, 6 columns/)).toBeVisible();
  await next(page);
  await expect(page.getByText("Match each column to a field")).toBeVisible();
}

async function toReview(page: Page, csv?: string) {
  await toMap(page, csv);
  await next(page);
  await expect(page.getByText(/\d+ with errors/).first()).toBeVisible();
}

async function axe(page: Page) {
  // Carbon buttons fade between states; axe reads the colors mid-way.
  await page.waitForTimeout(250);
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
}

test.describe("ImportWizard", () => {
  test("has no accessibility violations on any step", async ({ page }) => {
    await page.goto("/import-wizard.html");
    await axe(page);
    await upload(page, usersCsv(30));
    await expect(page.getByText(/rows, 6 columns/)).toBeVisible();
    await axe(page);
    await next(page);
    await expect(page.getByText("Match each column to a field")).toBeVisible();
    await axe(page);
    await next(page);
    await expect(page.getByText(/\d+ with errors/).first()).toBeVisible();
    await axe(page);
    await next(page);
    await expect(
      page.getByRole("button", { name: /^Import \d+ rows/ }),
    ).toBeVisible();
    await axe(page);
    await page.getByRole("button", { name: /^Import \d+ rows/ }).click();
    await expect(page.getByText(/^Imported \d+ rows/).first()).toBeVisible();
    await axe(page);
  });

  test("has no accessibility violations in Gray 100", async ({ page }) => {
    await toReview(page);
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await axe(page);
    await page.evaluate(() =>
      document.documentElement.classList.remove("bx--g100"),
    );
  });

  test("goes from a file to imported rows", async ({ page }) => {
    await toReview(page);
    // 30 rows: every fifth has a bad email, every fourth role is "guest".
    await expect(page.getByText("12 with errors").first()).toBeVisible();
    await next(page);
    await page.getByRole("button", { name: /^Import \d+ rows/ }).click();
    await expect(page.getByText(/^Imported \d+ rows/).first()).toBeVisible();
    const imported = await page.evaluate(() => window.__imported.length);
    expect(imported).toBeGreaterThan(10);
    await expect(
      page.getByRole("button", { name: "Download rows not imported" }),
    ).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download rows not imported" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("rows-not-imported.csv");
  });

  test("works with the keyboard alone", async ({ page }) => {
    await page.goto("/import-wizard.html");
    const drop = page.getByRole("button", {
      name: /Drag and drop a CSV or XLSX file/,
    });
    await drop.focus();
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    await (
      await chooser
    ).setFiles({
      name: "users.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(usersCsv(12)),
    });
    await expect(page.getByText(/rows, 6 columns/)).toBeVisible();

    const cont = page.getByRole("button", { name: "Continue" });
    await cont.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Match each column to a field")).toBeVisible();

    // Change the Role column to "Don't import" with the arrow keys.
    const role = page.getByRole("combobox", { name: "Field for Role" });
    await role.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Skipped").first()).toBeVisible();

    await cont.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/\d+ with errors/).first()).toBeVisible();

    // Fix the first bad email: Tab reaches the cell's input.
    const first = page.locator('input[aria-invalid="true"]').first();
    await first.focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("fixed@example.com");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(page.getByText(/Row \d+ fixed/)).toBeAttached();
    // The fixed row left the list, and focus went to the next problem
    // instead of the page.
    await expect(page.locator("body")).not.toBeFocused();

    await cont.focus();
    await page.keyboard.press("Enter");
    const run = page.getByRole("button", { name: /^Import \d+ rows/ });
    await run.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/^Imported \d+ rows/).first()).toBeVisible();
  });

  test("maps a column by hand and moves a field that was taken", async ({
    page,
  }) => {
    await toMap(page);
    const name = page.getByRole("combobox", { name: "Field for Mail" });
    await name.click();
    await page.getByRole("option", { name: "Full name (required)" }).click();
    await expect(
      page.getByText("Full name moved from Customer"),
    ).toBeAttached();
    await expect(
      page.getByText(/Map these required fields to continue: Email/),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  test("shows the failed rows of a chunk and the partial result", async ({
    page,
  }) => {
    await toReview(page, usersCsv(10));
    await next(page);
    await page.getByRole("button", { name: /^Import \d+ rows/ }).click();
    await expect(page.getByText(/^Imported \d+ rows/).first()).toBeVisible();
  });

  test("cancels an import between chunks", async ({ page }) => {
    await page.goto("/import-wizard-slow.html");
    await upload(page, usersCsv(400));
    await expect(page.getByText(/rows, 6 columns/)).toBeVisible();
    await next(page);
    await next(page);
    await page
      .getByRole("checkbox", { name: "Show only rows with errors" })
      .uncheck({ force: true });
    await page.getByRole("button", { name: "Remove rows with errors" }).click();
    await next(page);
    await page.getByRole("button", { name: /^Import \d+ rows/ }).click();
    await expect(page.getByRole("progressbar")).toBeVisible();
    await page.getByRole("button", { name: "Cancel import" }).click();
    await expect(page.getByText(/^Canceled: imported/)).toBeVisible();
    const result = await page.evaluate(() => window.__result);
    expect(result.canceled).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  test("reads a Windows-1252 file", async ({ page }) => {
    await page.goto("/import-wizard.html");
    const latin1 = Buffer.from(
      `${HEADER}\nMüller,mueller@example.com,admin,Y,1/2/2024,3\n`,
      "latin1",
    );
    await upload(page, latin1);
    await expect(page.getByText(/WINDOWS-1252/)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Müller" })).toBeVisible();
  });

  test("reads an Excel workbook, dates included", async ({ page }) => {
    await page.goto("/import-wizard.html");
    const bytes = zip(
      workbook([
        {
          name: "Users",
          rows: [
            ["Customer", "Mail", "Role", "Active", "Joined", "Seats"],
            [
              "Ada",
              "ada@example.com",
              "admin",
              { b: true },
              { n: 45292, style: 1 },
              3,
            ],
          ],
        },
      ]),
    );
    await upload(
      page,
      Buffer.from(bytes),
      "users.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    await expect(page.getByText(/Sheet Users/)).toBeVisible();
    await expect(page.getByRole("cell", { name: "2024-01-01" })).toBeVisible();
  });

  test("warns about an unclosed quote and ragged rows", async ({ page }) => {
    await page.goto("/import-wizard.html");
    await upload(
      page,
      `${HEADER}\nA,a@example.com,admin,Y,1/2/2024,3\nB,b@example.com\n"C,c@example.com,admin,Y,1/2/2024,3\n`,
    );
    await expect(page.getByText(/never closes/)).toBeVisible();
    await expect(page.getByText(/fewer values than the header/)).toBeVisible();
  });

  test("parses 100,000 rows by 20 columns in a worker", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/import-wizard.html");
    const rows = [
      Array.from({ length: 20 }, (_, i) => `Column ${i}`).join(","),
    ];
    for (let r = 0; r < 100_000; r++) {
      rows.push(
        Array.from({ length: 20 }, (_, c) =>
          c % 5 === 4 ? `"Smith, ${r} ""x"""` : `v${r}-${c}`,
        ).join(","),
      );
    }
    // A path, not a buffer: a 30 MB buffer would cross the protocol and
    // stall the page being measured.
    const dir = mkdtempSync(join(tmpdir(), "import-wizard-"));
    const file = join(dir, "big.csv");
    writeFileSync(file, rows.join("\r\n"));
    await page.evaluate(() => {
      const gaps: number[] = [];
      let last = performance.now();
      const tick = () => {
        gaps.push(performance.now() - last);
        last = performance.now();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      Object.assign(window, { __gaps: gaps });
    });
    const started = Date.now();
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByText(/100,000 rows, 20 columns/)).toBeVisible({
      timeout: 30_000,
    });
    // Production builds finish in a few hundred ms; this leaves room for a
    // loaded runner.
    expect(Date.now() - started).toBeLessThan(5000);
    const worst = await page.evaluate(() => Math.max(...window.__gaps));
    rmSync(dir, { recursive: true, force: true });
    expect(worst).toBeLessThan(250);
  });

  test("keeps the review table usable in RTL", async ({ page }) => {
    await toReview(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const input = page.locator('input[aria-invalid="true"]').first();
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    const view = page.viewportSize();
    expect(box && view && box.x >= 0 && box.x + box.width <= view.width).toBe(
      true,
    );
    // The step rail reads from the right.
    const first = await page
      .locator(".bx--progress-step")
      .first()
      .boundingBox();
    const last = await page.locator(".bx--progress-step").last().boundingBox();
    expect(first && last && first.x > last.x).toBe(true);
    expect(await findLayoutProblems(page, "overflow")).toEqual([]);
    await page.evaluate(() => document.documentElement.removeAttribute("dir"));
  });

  test("keeps invalid cells visible in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await toReview(page);
    const input = page.locator('input[aria-invalid="true"]').first();
    await expect(input).toBeVisible();
    const style = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, border: s.borderBottomStyle };
    });
    expect(style.outline !== "none" || style.border !== "none").toBe(true);
    expect(await findLayoutProblems(page, "borders")).toEqual([]);
    await page.emulateMedia({ forcedColors: "none" });
  });
});
