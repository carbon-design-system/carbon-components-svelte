import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Popconfirm in a DataTable", () => {
  for (const sticky of [false, true]) {
    test(`stays whole in a ${sticky ? "scrolling" : "plain"} table`, async ({
      page,
    }) => {
      if (sticky) await page.goto("/popconfirm-containers.html?sticky");
      else await page.goto("/popconfirm-containers.html");
      const trigger = page.getByTestId("delete-11");
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const dialog = page.getByRole("alertdialog", {
        name: "Delete Service 12?",
      });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Cancel" }),
      ).toBeFocused();

      // Not clipped by the table's scroll box: every edge is in the window.
      const box = await dialog.boundingBox();
      const view = page.viewportSize();
      expect(box).not.toBeNull();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect(box?.y).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        view?.width ?? 0,
      );
      // Its buttons take clicks, so nothing cuts them off.
      await dialog.getByRole("button", { name: "Delete" }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByTestId("log")).toContainText("deleted:11");
    });
  }

  test("follows its trigger when the table scrolls", async ({ page }) => {
    await page.goto("/popconfirm-containers.html?sticky");
    await page.getByTestId("delete-3").click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const before = await dialog.boundingBox();
    await page.getByTestId("delete-3").evaluate((el) => {
      for (let node = el.parentElement; node; node = node.parentElement) {
        if (node.scrollHeight > node.clientHeight + 10) {
          node.scrollTop = 40;
          break;
        }
      }
    });
    await expect
      .poll(async () => (await dialog.boundingBox())?.y)
      .not.toBe(before?.y);
  });
});

test.describe("Popconfirm in a Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/popconfirm-containers.html?modal");
    await expect(
      page.getByRole("dialog", { name: "Edit project" }),
    ).toBeVisible();
    await page.getByTestId("modal-trigger").click();
    await expect(
      page.getByRole("alertdialog", { name: "Remove Ada?" }),
    ).toBeVisible();
  });

  test("Escape closes only the popconfirm, then the modal", async ({
    page,
  }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(
      page.getByRole("dialog", { name: "Edit project" }),
    ).toBeVisible();
    await expect(page.getByTestId("modal-trigger")).toBeFocused();
    await expect(page.getByTestId("modal-closed")).toHaveText("0");

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Edit project" }),
    ).toBeHidden();
  });

  test("Tab stays in the popconfirm", async ({ page }) => {
    const dialog = page.getByRole("alertdialog");
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Remove" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("closing the modal closes it", async ({ page }) => {
    // As an app would: no click reaches the window, so only the modal's own
    // close can take the popconfirm down.
    await page.evaluate(() =>
      (window as unknown as { closeModal(): void }).closeModal(),
    );
    await expect(
      page.getByRole("dialog", { name: "Edit project" }),
    ).toBeHidden();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });

  test("a click on the backdrop closes the popconfirm, and leaves the modal to its own rule", async ({
    page,
  }) => {
    // A modal with buttons ignores a backdrop click by default, so it stays.
    // Master has no layer stack: with `preventCloseOnClickOutside={false}`
    // the one press would reach both.
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/popconfirm-containers.html?modal");
    await page.getByTestId("modal-trigger").click();
    await expect(
      page.locator("[role=alertdialog].bx--popover--open"),
    ).toBeVisible();
    // The outside listener arms a task after opening, so retry the press.
    await expect(async () => {
      await page.mouse.click(5, 400);
      await expect(page.getByRole("alertdialog")).toBeHidden({ timeout: 500 });
    }).toPass();
    await expect(
      page.getByRole("dialog", { name: "Edit project" }),
    ).toBeVisible();
  });

  test("a click in the modal outside it closes only the popconfirm", async ({
    page,
  }) => {
    await page.getByText("Remove a member from this project.").click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(
      page.getByRole("dialog", { name: "Edit project" }),
    ).toBeVisible();
  });
});

test.describe("Popconfirm direction and contrast", () => {
  for (const dir of ["ltr", "rtl"] as const) {
    test(`align="end" follows the inline end in ${dir}`, async ({ page }) => {
      await page.goto("/popconfirm-containers.html");
      await page.evaluate((d) => (document.documentElement.dir = d), dir);
      const trigger = page.getByTestId("delete-1");
      await trigger.click();
      const dialog = page.getByRole("alertdialog", {
        name: "Delete Service 2?",
      });
      await expect(dialog).toBeVisible();
      await expect
        .poll(async () => {
          const box = await dialog.boundingBox();
          const anchor = await trigger.boundingBox();
          if (!(box && anchor)) return null;
          const center = anchor.x + anchor.width / 2;
          // The box reaches back toward the inline start of the page, and
          // lines up with the trigger's inline end.
          return dir === "ltr"
            ? box.x + box.width <= anchor.x + anchor.width + 2 && box.x < center
            : box.x >= anchor.x - 2 && box.x + box.width > center;
        })
        .toBe(true);
    });
  }

  test("keeps an edge in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/popconfirm.html");
    await page.getByTestId("basic-trigger").click();
    const edge = await page
      .getByRole("alertdialog")
      .locator(".bx--popover-contents")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return `${style.outlineStyle} ${style.outlineWidth}`;
      });
    expect(edge).not.toMatch(/^none/);
    await expect(
      page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }),
    ).toBeVisible();
  });

  test("has no accessibility violations in Gray 100 and RTL", async ({
    page,
  }) => {
    await page.goto("/popconfirm.html");
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.documentElement.dir = "rtl";
    });
    await page.getByTestId("async-fail-trigger").click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Popconfirm on a small screen", () => {
  for (const testId of ["basic-trigger", "delete-1"]) {
    test(`fits a 320px window from ${testId}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      if (testId === "basic-trigger") await page.goto("/popconfirm.html");
      else await page.goto("/popconfirm-containers.html");
      const trigger = page.getByTestId(testId);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const dialog = page.getByRole("alertdialog", { name: /^Delete/ }).first();
      await expect(dialog).toBeVisible();
      await expect
        .poll(async () => {
          const box = await dialog.boundingBox();
          return box ? box.x >= 0 && box.x + box.width <= 320 : false;
        })
        .toBe(true);
      await dialog.getByRole("button", { name: "Delete" }).click();
      await expect(dialog).toBeHidden();
    });
  }
});
