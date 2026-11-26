import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const section = (page: Page, name: string) =>
  page.getByTestId(`address-${name}`);

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error("not rendered");
  return result;
}

/** What a browser's autofill does to a control: set it, then fire the events. */
function autofill(locator: Locator, text: string) {
  return locator.evaluate(async (control, value) => {
    const proto =
      control instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(control, value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    // A browser runs microtasks, and the framework its flush, between the
    // fields it fills.
    await new Promise((resolve) => setTimeout(resolve));
  }, text);
}

const valueOf = async (page: Page, name: string) =>
  JSON.parse(
    (await page.getByTestId(`address-${name}-value`).textContent()) ?? "{}",
  );

test.describe("AddressForm", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/address-form.html");
    await expect(section(page, "us").getByLabel("Country")).toBeVisible();
  });

  test.describe("layout", () => {
    test("puts city, state and ZIP code on one row", async ({ page }) => {
      const us = section(page, "us");
      const city = await box(us.getByLabel("City"));
      const state = await box(us.getByLabel("State"));
      const zip = await box(us.getByLabel("ZIP code"));

      expect(Math.abs(city.y - state.y)).toBeLessThan(2);
      expect(Math.abs(city.y - zip.y)).toBeLessThan(2);
      expect(city.x).toBeLessThan(state.x);
      expect(state.x).toBeLessThan(zip.x);
      // The city takes twice the width of the state.
      expect(city.width).toBeGreaterThan(state.width * 1.5);
    });

    test("stacks the row in a narrow container", async ({ page }) => {
      const narrow = section(page, "narrow");
      const city = await box(narrow.getByLabel("City"));
      const state = await box(narrow.getByLabel("State"));
      const zip = await box(narrow.getByLabel("ZIP code"));

      expect(state.y).toBeGreaterThan(city.y + city.height - 1);
      expect(zip.y).toBeGreaterThan(state.y + state.height - 1);
      expect(Math.abs(city.x - zip.x)).toBeLessThan(2);
      expect(Math.abs(city.width - zip.width)).toBeLessThan(2);
    });

    test("stacks every field at a 320px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      const us = section(page, "us");
      const city = await box(us.getByLabel("City"));
      const zip = await box(us.getByLabel("ZIP code"));

      expect(zip.y).toBeGreaterThan(city.y);
      expect(Math.abs(city.x - zip.x)).toBeLessThan(2);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("follows the order of Japan, and tabs through it", async ({
      page,
    }) => {
      const jp = section(page, "jp");
      const order = [
        "Postal code",
        "Prefecture",
        "City",
        "Address line 1",
        "Address line 2 (optional)",
        "Company (optional)",
        "Full name (optional)",
      ];
      const boxes = [];
      for (const label of order) {
        // eslint-disable-next-line no-await-in-loop -- each box is read in turn
        boxes.push(await box(jp.getByLabel(label)));
      }

      // Down the page, with the prefecture and the city on one row.
      for (let i = 1; i < boxes.length; i++) {
        if (order[i] === "City") {
          expect(Math.abs(boxes[i].y - boxes[i - 1].y)).toBeLessThan(2);
        } else {
          expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + 1);
        }
      }

      // Tab order is DOM order, which is visual order.
      await jp.getByLabel("Country").focus();
      const tabbed = [];
      for (let i = 0; i < order.length; i++) {
        // eslint-disable-next-line no-await-in-loop -- one Tab at a time
        await page.keyboard.press("Tab");
        // eslint-disable-next-line no-await-in-loop -- one Tab at a time
        tabbed.push(await page.evaluate(() => document.activeElement?.id));
      }
      expect(tabbed).toEqual(
        [
          "postalCode",
          "region",
          "locality",
          "line1",
          "line2",
          "organization",
          "name",
        ].map((key) => `jp-${key}`),
      );
    });
  });

  test.describe("country switching", () => {
    test("keeps focus on the country and announces the change", async ({
      page,
    }) => {
      const us = section(page, "us");
      const country = us.getByLabel("Country");
      await us.getByLabel("Address line 1").fill("1 Main St");
      await us.getByLabel("City").fill("Springfield");
      await us.getByLabel("State").selectOption("IL");
      await us.getByLabel("ZIP code").fill("62704");

      await country.focus();
      await country.selectOption("GB");

      await expect(country).toBeFocused();
      await expect(us.getByRole("status")).toHaveText(
        "Address fields changed for United Kingdom. Cleared: State, ZIP code.",
      );
      await expect(us.getByLabel("Town/City")).toHaveValue("Springfield");
      await expect(us.getByLabel("Postcode")).toHaveValue("");
      expect(await valueOf(page, "us")).toEqual({
        country: "GB",
        lines: ["1 Main St"],
        locality: "Springfield",
      });
    });

    test("keeps the element, and its focus, of a field both countries have", async ({
      page,
    }) => {
      const us = section(page, "us");
      const line = us.getByLabel("Address line 1");
      await line.fill("1 Main St");
      const handle = await line.elementHandle();

      await us.getByLabel("Country").selectOption("DE");

      expect(
        await line.evaluate((node, original) => node === original, handle),
      ).toBe(true);
      await expect(line).toHaveValue("1 Main St");
    });

    test("changes the country from the keyboard", async ({ page }) => {
      const us = section(page, "us");
      await us.getByLabel("Country").focus();
      await page.keyboard.type("Germany");

      await expect(us.getByLabel("PLZ")).toBeVisible();
      await expect(us.getByLabel("Country")).toBeFocused();
    });
  });

  test.describe("autofill", () => {
    // Real autofill cannot be scripted. This does what Chrome does to each
    // control (the value, then input and change), country first, with the
    // framework's flush between fields.
    test("fills a UK address in document order", async ({ page }) => {
      const us = section(page, "us");
      await autofill(us.getByLabel("Full name (optional)"), "Ada Lovelace");
      await autofill(us.getByLabel("Country"), "GB");
      await autofill(us.getByLabel("Address line 1"), "10 Downing St");
      await autofill(us.getByLabel("Town/City"), "London");
      await autofill(us.getByLabel("Postcode"), "sw1a2aa");

      await expect(us.getByLabel("Postcode")).toHaveValue("SW1A 2AA");
      expect(await valueOf(page, "us")).toEqual({
        country: "GB",
        name: "Ada Lovelace",
        lines: ["10 Downing St"],
        locality: "London",
        postalCode: "SW1A 2AA",
      });
    });

    test("fills a US address, state by code", async ({ page }) => {
      const us = section(page, "us");
      await autofill(us.getByLabel("Address line 1"), "1 Infinite Loop");
      await autofill(us.getByLabel("City"), "Cupertino");
      await autofill(us.getByLabel("State"), "CA");
      await autofill(us.getByLabel("ZIP code"), "950141234");

      expect(await valueOf(page, "us")).toMatchObject({
        region: "CA",
        postalCode: "95014-1234",
      });
    });

    test("scopes the tokens, so the browser tells shipping from billing", async ({
      page,
    }) => {
      const us = section(page, "us");
      await expect(us.getByLabel("ZIP code")).toHaveAttribute(
        "autocomplete",
        "shipping postal-code",
      );
      await expect(us.getByLabel("State")).toHaveAttribute(
        "autocomplete",
        "shipping address-level1",
      );
    });
  });

  test.describe("validation", () => {
    test("shows every error and focuses the first on validate()", async ({
      page,
    }) => {
      const us = section(page, "us");
      await us.getByRole("button", { name: "Check" }).click();

      await expect(us.getByText("Address line 1 is required")).toBeVisible();
      await expect(us.getByText("State is required")).toBeVisible();
      await expect(us.getByLabel("Address line 1")).toBeFocused();
      await expect(page.getByTestId("address-us-errors")).toContainText(
        '"postalCode":"required"',
      );
    });
  });

  test.describe("right to left", () => {
    test("mirrors the row of an Arabic address", async ({ page }) => {
      const sa = section(page, "sa");
      const city = await box(sa.getByLabel("المدينة"));
      const postal = await box(sa.getByLabel("الرمز البريدي (اختياري)"));

      // The city comes first in the format, so it sits at the right.
      expect(Math.abs(city.y - postal.y)).toBeLessThan(2);
      expect(city.x).toBeGreaterThan(postal.x);
      const label = await box(sa.getByText("المدينة", { exact: true }));
      expect(
        Math.abs(label.x + label.width - (city.x + city.width)),
      ).toBeLessThan(2);
    });

    test("lays the whole page out right to left", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      const us = section(page, "us");
      const city = await box(us.getByLabel("City"));
      const state = await box(us.getByLabel("State"));
      const zip = await box(us.getByLabel("ZIP code"));

      expect(city.x).toBeGreaterThan(state.x);
      expect(state.x).toBeGreaterThan(zip.x);
    });
  });

  test.describe("themes", () => {
    test("has no accessibility violations on White", async ({ page }) => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });

    test("has no accessibility violations on Gray 100", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add("bx--g100");
      });
      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });

    test("has no accessibility violations right to left", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });

    test("has no accessibility violations with errors showing", async ({
      page,
    }) => {
      await section(page, "us").getByRole("button", { name: "Check" }).click();
      await expect(
        section(page, "us").getByText("State is required"),
      ).toBeVisible();
      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });

    test("keeps every field drawn, and the rows, in forced colors", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      const us = section(page, "us");

      for (const label of ["Address line 1", "City", "State", "ZIP code"]) {
        // eslint-disable-next-line no-await-in-loop -- each field is read in turn
        const border = await us
          .getByLabel(label)
          .evaluate((el) => getComputedStyle(el).borderBottomColor);
        expect(border, label).not.toBe("rgba(0, 0, 0, 0)");
      }
      const city = await box(us.getByLabel("City"));
      const zip = await box(us.getByLabel("ZIP code"));
      expect(Math.abs(city.y - zip.y)).toBeLessThan(2);
    });
  });
});
