import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectSingleRing } from "./helpers/layout";

const emails = (page: Page) => page.getByTestId("emails");
const email = (page: Page, n: number) =>
  emails(page).getByRole("textbox", { name: `Email ${n}` });
const value = (page: Page) =>
  page
    .getByTestId("emails-value")
    .evaluate((el) => JSON.parse(el.textContent ?? "[]"));

async function axe(page: Page) {
  // A theme switch runs the fields' color transitions; wait them out.
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
}

test.describe("FieldRepeater", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/field-repeater.html");
    await expect(email(page, 1)).toBeVisible();
  });

  test("has no accessibility violations on White, Gray 100 and RTL", async ({
    page,
  }) => {
    await axe(page);

    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await axe(page);

    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.setAttribute("dir", "rtl");
    });
    await axe(page);
  });

  test("has no accessibility violations with errors showing", async ({
    page,
  }) => {
    await page.goto("/field-repeater.html?errors");
    await expect(page.getByTestId("errors")).toBeVisible();

    await axe(page);
  });

  test("adds from the keyboard and focuses the new field", async ({ page }) => {
    await page.getByRole("button", { name: "Add another email" }).focus();

    await page.keyboard.press("Enter");

    await expect(email(page, 2)).toBeFocused();
    await expect(page.locator("#emails-status")).toHaveText("Email 2 added");
    await page.keyboard.type("grace@example.com");
    expect(await value(page)).toEqual(["ada@example.com", "grace@example.com"]);
  });

  test("keeps focus when the focused last item is removed", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add another email" }).click();
    await page.getByRole("button", { name: "Add another email" }).click();
    await expect(email(page, 3)).toBeFocused();

    await page.getByRole("button", { name: "Remove email 3" }).focus();
    await page.keyboard.press("Enter");

    await expect(email(page, 2)).toBeFocused();
    await expect(page.locator("#emails-status")).toContainText(
      "Email 3 removed",
    );
  });

  test("says when the minimum is reached and disables Remove", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add another email" }).click();
    await page.getByRole("button", { name: "Remove email 1" }).focus();

    await page.keyboard.press("Enter");

    await expect(email(page, 1)).toBeFocused();
    await expect(emails(page).getByRole("textbox")).toHaveCount(1);
    await expect(page.locator("#emails-limit")).toHaveText(
      "Minimum of 1 reached",
    );
    await expect(
      emails(page).getByRole("button", { name: "Remove email 1" }),
    ).toBeDisabled();
  });

  test("stops at max and says so", async ({ page }) => {
    const add = page.getByRole("button", { name: "Add another email" });
    for (let i = 0; i < 4; i++) await add.click();

    await expect(add).toBeDisabled();
    await expect(page.locator("#emails-limit")).toHaveText(
      "Maximum of 5 reached",
    );
    await expect(email(page, 5)).toBeFocused();
  });

  test("reorders from the keyboard and keeps focus on the control", async ({
    page,
  }) => {
    const add = page.getByRole("button", { name: "Add another email" });
    await add.click();
    await page.keyboard.type("grace@example.com");
    await add.click();
    await page.keyboard.type("linus@example.com");

    const down = emails(page).getByRole("button", {
      name: "Move email 1 down",
    });
    await down.focus();
    await page.keyboard.press("Enter");

    expect(await value(page)).toEqual([
      "grace@example.com",
      "ada@example.com",
      "linus@example.com",
    ]);
    await expect(
      emails(page).getByRole("button", { name: "Move email 2 down" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    const last = emails(page).getByRole("button", {
      name: "Move email 3 down",
    });
    await expect(last).toBeFocused();
    await expect(last).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(last).toBeFocused();
    await expect(page.locator("#emails-status")).toContainText(
      "moved to position",
    );
  });

  test("links an error to its field in a repeated item", async ({ page }) => {
    await page.goto("/field-repeater.html?errors");

    await page.getByRole("link", { name: /^Email 3:/ }).click();

    await expect(email(page, 3)).toBeFocused();
    await expect(email(page, 3)).toHaveAttribute("aria-invalid", "true");
  });

  test("posts each item under its own name", async ({ page }) => {
    const entries = await page
      .getByTestId("emails-form")
      .evaluate((form) => [...new FormData(form as HTMLFormElement)]);

    expect(entries).toEqual([["emails[0]", "ada@example.com"]]);
  });

  test("keeps collapsed fields in the post and opens one to edit", async ({
    page,
  }) => {
    const summary = page.getByTestId("summary");
    await expect(summary.getByText("ada@example.com")).toBeVisible();
    await expect(
      summary.getByRole("textbox", { name: "Backup email 1" }),
    ).toBeHidden();

    await summary.getByRole("button", { name: "Edit backup email 1" }).click();

    await expect(
      summary.getByRole("textbox", { name: "Backup email 1" }),
    ).toBeFocused();
  });

  test("moves and removes with a nested Select kept intact", async ({
    page,
  }) => {
    const team = page.getByTestId("team");
    await team
      .getByRole("combobox", { name: "Role" })
      .first()
      .selectOption("Designer");
    await team.getByRole("button", { name: "Remove member 1" }).click();

    await expect(team.getByRole("textbox", { name: "Name" })).toHaveValue(
      "Grace Hopper",
    );
    await expect(team.getByRole("textbox", { name: "Name" })).toBeFocused();
  });
});

test.describe("FieldRepeater with 50 items", () => {
  test("adds, moves and removes among 50 without lag or lost focus", async ({
    page,
  }) => {
    await page.goto("/field-repeater.html?many=50");
    await expect(email(page, 50)).toBeVisible();
    const field = email(page, 10);
    await field.evaluate((el) => el.setAttribute("data-same", ""));

    const start = Date.now();
    await emails(page)
      .getByRole("button", { name: "Move email 10 down" })
      .click();
    await expect(email(page, 11)).toHaveAttribute("data-same", "");
    const moved = Date.now() - start;

    const removeStart = Date.now();
    await emails(page).getByRole("button", { name: "Remove email 25" }).click();
    await expect(emails(page).getByRole("textbox")).toHaveCount(49);
    const removed = Date.now() - removeStart;

    expect(moved).toBeLessThan(1000);
    expect(removed).toBeLessThan(1000);
    await expect(email(page, 25)).toBeFocused();
  });

  test("survives rapid add and remove", async ({ page }) => {
    await page.goto("/field-repeater.html?many=10");

    await page.evaluate(() => {
      const root = document.querySelector(
        "[data-testid=emails]",
      ) as HTMLElement;
      const button = (name: string) =>
        [...root.querySelectorAll("button")].find(
          (b) =>
            b.textContent?.includes(name) ||
            b.querySelector(".bx--assistive-text")?.textContent === name,
        ) as HTMLButtonElement;
      for (let i = 0; i < 30; i++) {
        button("Add another").click();
        button("Remove email 1").click();
      }
    });

    await expect(emails(page).getByRole("textbox")).toHaveCount(10);
    expect((await value(page)).length).toBe(10);
  });
});

test.describe("FieldRepeater forced colors and RTL", () => {
  test("keeps every button and field visible in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/field-repeater.html");

    const buttons = page.getByTestId("emails").getByRole("button");
    for (const button of await buttons.all())
      await expect(button).toBeVisible();
    await page.getByRole("button", { name: "Move email 1 down" }).focus();
    await expectSingleRing(emails(page));

    // A Move button that cannot act reads GrayText, as a disabled one does.
    const read = (name: string) =>
      page
        .getByTestId("summary")
        .getByRole("button", { name })
        .first()
        .evaluate((el) => {
          const probe = document.createElement("i");
          probe.style.color = "GrayText";
          document.body.append(probe);
          const grayText = getComputedStyle(probe).color;
          probe.remove();
          return {
            grayText,
            color: getComputedStyle(el).color,
            fill: getComputedStyle(el.querySelector("path") as Element).fill,
          };
        });
    const inert = await read("Move backup email 1 up");
    const live = await read("Move backup email 1 down");
    expect(inert.color).toBe(inert.grayText);
    expect(inert.fill).toBe(inert.grayText);
    expect(live.color).not.toBe(live.grayText);
  });

  test("puts the buttons at the inline end of the field in RTL", async ({
    page,
  }) => {
    await page.goto("/field-repeater.html");
    const boxes = () =>
      page.evaluate(() => {
        const field = document.querySelector("#emails-0-email") as HTMLElement;
        const remove = [
          ...document.querySelectorAll("[data-testid=emails] button"),
        ].find(
          (b) =>
            b.querySelector(".bx--assistive-text")?.textContent ===
            "Remove email 1",
        ) as HTMLElement;
        return {
          field: field.getBoundingClientRect().toJSON(),
          remove: remove.getBoundingClientRect().toJSON(),
        };
      });

    const ltr = await boxes();
    expect(ltr.remove.left).toBeGreaterThanOrEqual(ltr.field.right);

    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const rtl = await boxes();
    expect(rtl.remove.right).toBeLessThanOrEqual(rtl.field.left);
  });
});
