import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { getAXTree } from "./helpers/ax-tree";
import { expect, test } from "./helpers/host";

const open = (page: Page, search = "") =>
  page.goto(`/schema-form.html?${search}`);

const field = (page: Page, path: string) =>
  page.locator(`[data-schema-path="${path}"]`);

/** Fill the fields the form requires, through their controls. */
async function fillRequired(page: Page) {
  await page.getByLabel("Instance name").fill("web-1");
  await page.getByLabel("Owner email").fill("ada@example.com");
  await field(page, "basics.region").getByRole("combobox").click();
  await page.getByRole("option", { name: "Frankfurt (eu-de)" }).click();
  await field(page, "compute.size").locator("select").selectOption("m");
  await page
    .getByLabel("Admin password", { exact: true })
    .fill("a long password!");
  await page.getByLabel("Confirm password").fill("a long password!");
}

test.describe("SchemaForm", () => {
  test("submits the values of a filled form", async ({ page }) => {
    await open(page);
    await fillRequired(page);
    await page.getByRole("button", { name: "Submit" }).click();
    // The name is checked by an async validator, so the submit waits for it.
    await expect(page.getByTestId("submitted")).toContainText('"basics"');
    const submitted = JSON.parse(
      (await page.getByTestId("submitted").textContent()) || "null",
    );
    expect(submitted.basics).toMatchObject({
      name: "web-1",
      owner: "ada@example.com",
      region: "eu-de",
      environment: "dev",
    });
    expect(submitted.compute).toMatchObject({ size: "m", vcpu: 4, memory: 8 });
    expect(submitted.compute).not.toHaveProperty("gpuModel");
    expect(submitted.access).toMatchObject({
      adminPassword: "a long password!",
    });
  });

  test("reaches every field from the error summary with the keyboard", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Submit" }).focus();
    await page.keyboard.press("Enter");

    const summary = page.getByRole("group", { name: /problems/ });
    await expect(summary).toBeFocused();
    const links = summary.getByRole("link");
    await expect(links).toHaveText([
      "Instance name is required",
      "Region is required",
      "Size is required",
      "Admin password is required",
      "Confirm password is required",
    ]);

    // Tab enters the summary's links in order; Enter on one focuses the
    // field it names, and Shift+Tab goes back into the form.
    await page.keyboard.press("Tab");
    await expect(links.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(links.nth(2)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(field(page, "compute.size").locator("select")).toBeFocused();

    await page.keyboard.press("m");
    await page.keyboard.press("Tab");
    // The form went on from "Size", it did not return to the top.
    const active = await page.evaluate(() =>
      document.activeElement
        ?.closest("[data-schema-path]")
        ?.getAttribute("data-schema-path"),
    );
    expect(active).toBe("compute.vcpu");
  });

  test("wires each error to its field for assistive tech", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Submit" }).click();
    const tree = await getAXTree(page);
    const [name] = await tree.query("textbox", "Instance name");
    expect(name.invalid).toBe(true);
    expect(name.errorMessage).toBe("Instance name is required");
    const [size] = await tree.query("combobox", "Size");
    expect(size.invalid).toBe(true);
    await tree.dispose();
  });

  test("names groups with fieldset and legend", async ({ page }) => {
    await open(page);
    const tree = await getAXTree(page);
    const legends = ["Basics", "Compute", "Storage", "Networking", "Access"];
    const groups = await Promise.all(
      legends.map((legend) => tree.query("group", legend)),
    );
    expect(groups.map((found) => found.length)).toEqual([1, 1, 1, 1, 1]);
    expect(await tree.query("group", "Open ports (optional)")).toHaveLength(1);
    expect(
      await tree.query("radiogroup", "Environment (optional)"),
    ).toHaveLength(1);
    await tree.dispose();
  });

  test("shows a conditional field only while its condition holds", async ({
    page,
  }) => {
    await open(page);
    await expect(page.getByText("GPU model")).toHaveCount(0);
    const gpu = field(page, "compute.gpu");
    await gpu.locator("label.bx--toggle-input__label").click();
    await expect(page.getByText("GPU model", { exact: true })).toBeVisible();
    await gpu.locator("label.bx--toggle-input__label").click();
    await expect(page.getByText("GPU model")).toHaveCount(0);
  });

  test("adds, reorders and removes a row with the keyboard", async ({
    page,
  }) => {
    await open(page);
    const add = page.getByRole("button", { name: "Add data disk" });
    await add.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Size (GB)")).toBeFocused();
    await page.keyboard.type("10");
    await page.keyboard.press("Enter");
    await add.press("Enter");
    await page.keyboard.type("20");
    const sizes = page.getByLabel("Size (GB)");
    await expect(sizes).toHaveCount(2);

    const down = page.getByRole("button", { name: /^Move down \(Disk 1\)/ });
    await down.focus();
    await page.keyboard.press("Enter");
    await expect(sizes.nth(0)).toHaveValue("20");
    await expect(sizes.nth(1)).toHaveValue("10");
    // Focus follows the moved row, so the move can repeat.
    await expect(
      page.getByRole("button", { name: /^Move up \(Disk 2\)/ }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Remove Disk 1" }).press("Enter");
    await expect(sizes).toHaveCount(1);
    await expect(sizes).toHaveValue("10");
    await expect(page.locator("form > [role=status]")).toContainText(
      "Disk 1 removed",
    );
  });

  test("keeps the values of an array row in a native form post", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Add data disk" }).click();
    await page.getByLabel("Size (GB)").fill("42");
    const posted = await page.evaluate(() => {
      const form = document.querySelector("form") as HTMLFormElement;
      return [...new FormData(form).entries()]
        .filter(([key]) => key.startsWith("storage.disks"))
        .map(([key, value]) => `${key}=${value}`);
    });
    expect(posted).toContain("storage.disks[0].size=42");
  });

  test("resets to the starting values", async ({ page }) => {
    await open(page);
    await page.getByLabel("Owner email").fill("other@example.com");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByLabel("Owner email")).toHaveValue("ada@example.com");
  });

  test.describe("axe", () => {
    const run = async (page: Page) => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    };

    test("has no violations on White", async ({ page }) => {
      await open(page);
      await run(page);
    });

    test("has no violations with errors showing", async ({ page }) => {
      await open(page);
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(page.getByRole("group", { name: /problems/ })).toBeVisible();
      await run(page);
    });

    test("has no violations on Gray 100", async ({ page }) => {
      await open(page);
      await page.evaluate(() =>
        document.documentElement.classList.add("bx--g100"),
      );
      await page.getByRole("button", { name: "Submit" }).click();
      await run(page);
    });

    test("has no violations in a fluid form", async ({ page }) => {
      await open(page, "fluid=true");
      await run(page);
    });

    test("has no violations right to left", async ({ page }) => {
      await open(page);
      await page.evaluate(() => (document.documentElement.dir = "rtl"));
      await page.getByRole("button", { name: "Submit" }).click();
      await run(page);
    });
  });

  test("keeps the summary and rows drawn in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await page.getByRole("button", { name: "Add data disk" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    const borders = await page.evaluate(() => {
      const border = (selector: string) => {
        const style = getComputedStyle(
          document.querySelector(selector) as Element,
        );
        return `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
      };
      return {
        summary: border(".bx--schema-form__summary"),
        row: border(".bx--schema-form__row"),
      };
    });
    expect(borders.summary).toMatch(/^1px solid rgb/);
    expect(borders.row).toMatch(/^1px solid rgb/);
  });

  test("lays the summary's heavy edge on the start side in RTL", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await page.getByRole("button", { name: "Submit" }).click();
    const widths = await page.evaluate(() => {
      const style = getComputedStyle(
        document.querySelector(".bx--schema-form__summary") as Element,
      );
      return [style.borderLeftWidth, style.borderRightWidth];
    });
    expect(widths).toEqual(["1px", "4px"]);
  });
});
