import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** Records every text the live regions of a list take on. */
async function listen(page: Page, testId: string) {
  await page.evaluate((id) => {
    const root = document.querySelector(`[data-testid=${id}]`) as HTMLElement;
    const said: { polite: string[]; alert: string[] } = {
      polite: [],
      alert: [],
    };
    (window as unknown as { said: typeof said }).said = said;
    for (const [key, role] of [
      ["polite", "status"],
      ["alert", "alert"],
    ] as const) {
      const region = root.querySelector(`[role=${role}]`) as HTMLElement;
      new MutationObserver(() => {
        if (region.textContent) said[key].push(region.textContent);
      }).observe(region, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
  }, testId);
}

const said = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { said: { polite: string[]; alert: string[] } })
        .said,
  );

const rows = (page: Page, testId: string) =>
  page
    .locator(`[data-testid=${testId}] li`)
    .evaluateAll((items) =>
      items.map((item) =>
        (item.querySelector(".bx--task-status-list__label")?.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim(),
      ),
    );

test.describe("TaskStatusList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/task-status-list.html");
    await expect(page.getByRole("list", { name: "Statuses" })).toBeVisible();
  });

  test.describe("axe", () => {
    test("is clean in the White theme", async ({ page }) => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });

    test("is clean in Gray 100", async ({ page }) => {
      await page.evaluate(async () => {
        document.documentElement.classList.add("bx--g100");
        // The link's color transitions to the new theme; axe reads it mid-way.
        await Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation instanceof CSSTransition)
            .map((animation) => animation.finished),
        );
      });
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });

    test("is clean in RTL", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  });

  test("says every status in text and draws every status as its own shape", async ({
    page,
  }) => {
    expect(await rows(page, "statuses")).toEqual([
      "Create VPC, Succeeded",
      "Create subnets, Running",
      "Install ingress, Pending",
      "Configure network, Failed",
      "Seed sample data, Skipped",
      "Send invitations, Canceled",
    ]);

    // The visible icon of each row, by its path data: six shapes, so a
    // status needs no color to be told apart.
    const shapes = await page
      .locator("[data-testid=statuses] .bx--task-status-list__icon")
      .evaluateAll((icons) =>
        icons.map((icon) =>
          [
            ...icon.querySelectorAll(
              "svg:not(.bx--loading__svg) path, .bx--loading__svg circle",
            ),
          ]
            .filter(
              (shape) => (shape as SVGElement).getClientRects().length > 0,
            )
            .map(
              (shape) => shape.getAttribute("d") ?? shape.getAttribute("class"),
            )
            .join("|"),
        ),
      );
    expect(new Set(shapes).size).toBe(6);
  });

  test("opens an error under a button that names its step", async ({
    page,
  }) => {
    const toggle = page.getByRole("button", { name: /Hide details/ }).first();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAccessibleDescription(
      /^Configure network\s*, Failed$/,
    );
    await toggle.click();
    await expect(
      page.getByText("NetworkTimeout", { exact: false }).first(),
    ).toBeHidden();
  });

  test("keeps the order of the icon, the label and the time in RTL", async ({
    page,
  }) => {
    const order = () =>
      page.evaluate(() => {
        const row = document.querySelector(
          "[data-testid=statuses] li",
        ) as HTMLElement;
        const x = (selector: string) =>
          (row.querySelector(selector) as HTMLElement).getBoundingClientRect()
            .x;
        return {
          icon: x(".bx--task-status-list__icon"),
          label: x(".bx--task-status-list__label"),
          time: x(".bx--task-status-list__duration"),
        };
      });

    const ltr = await order();
    expect(ltr.icon).toBeLessThan(ltr.label);
    expect(ltr.label).toBeLessThan(ltr.time);

    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const rtl = await order();
    expect(rtl.icon).toBeGreaterThan(rtl.label);
    expect(rtl.label).toBeGreaterThan(rtl.time);
  });

  test("swaps the spinner for a static icon under reduced motion", async ({
    page,
  }) => {
    const animations = () =>
      page.evaluate(
        () =>
          (
            document.querySelector("[data-testid=statuses]") as HTMLElement
          ).getAnimations({ subtree: true }).length,
      );
    const spinner = page.locator(
      "[data-testid=statuses] .bx--task-status-list__spinner",
    );
    const staticIcon = page.locator(
      "[data-testid=statuses] .bx--task-status-list__static",
    );

    await expect(spinner).toBeVisible();
    await expect(staticIcon).toBeHidden();
    expect(await animations()).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: "reduce" });

    await expect(spinner).toBeHidden();
    await expect(staticIcon).toBeVisible();
    expect(await animations()).toBe(0);
  });

  test("counts a running step up and holds its place", async ({ page }) => {
    const time = page.locator(
      "[data-testid=statuses] .bx--task-status-list__step--running time",
    );
    await expect(time).toHaveText(/^[5-9]s$/);
    const before = await time.boundingBox();
    await expect(time).toHaveText(/^(?!5s)\d+s$/, { timeout: 5000 });
    const after = await time.boundingBox();
    expect(after?.width).toBe(before?.width);
  });

  test("fifty steps and a failure: a few announcements, one row each, and a retry that keeps what finished", async ({
    page,
  }) => {
    await listen(page, "many");
    await page.evaluate(() => {
      const items = document.querySelectorAll("[data-testid=many] li");
      items.forEach((item, index) => {
        (item as HTMLElement & { tag?: number }).tag = index;
      });
    });

    const started = Date.now();
    await page.getByTestId("run-many").click();
    await expect(page.locator("[data-testid=many] [role=alert]")).toHaveText(
      "Failed at step 37: Step 37",
      { timeout: 15_000 },
    );
    const seconds = (Date.now() - started) / 1000;

    const first = await page
      .getByTestId("many")
      .locator("time")
      .first()
      .getAttribute("datetime");
    expect(await rows(page, "many").then((all) => all.slice(35, 38))).toEqual([
      "Step 36, Succeeded",
      "Step 37, Failed",
      "Step 38, Pending",
    ]);
    await expect(
      page.getByRole("button", { name: "Retry from step 37" }),
    ).toBeVisible();

    const afterFailure = await said(page);
    // At most one progress message per second, plus the first.
    expect(afterFailure.polite.length).toBeLessThanOrEqual(
      Math.ceil(seconds) + 1,
    );
    expect(afterFailure.alert).toEqual(["Failed at step 37: Step 37"]);

    await page.getByRole("button", { name: "Retry from step 37" }).click();
    await expect(page.locator("[data-testid=many] [role=status]")).toHaveText(
      "All 50 steps complete",
      { timeout: 15_000 },
    );

    // Step 1 was not run again, and no row was made again.
    expect(
      await page
        .getByTestId("many")
        .locator("time")
        .first()
        .getAttribute("datetime"),
    ).toBe(first);
    const identity = await page.evaluate(() =>
      [...document.querySelectorAll("[data-testid=many] li")].every(
        (item, index) => (item as HTMLElement & { tag?: number }).tag === index,
      ),
    );
    expect(identity).toBe(true);
  });

  test("cancels mid-step with the keyboard, keeps focus, and retries the rest", async ({
    page,
  }) => {
    await listen(page, "slow");
    await page.getByTestId("run-slow").click();
    const running = page.locator("[data-testid=slow] [aria-current=step]");
    await expect(running).toContainText("Import");

    const cancel = page
      .getByTestId("slow")
      .getByRole("button", { name: "Cancel" });
    await cancel.focus();
    await page.keyboard.press("Enter");

    expect(await rows(page, "slow")).toEqual([
      "Validate, Succeeded",
      "Import, Canceled",
      "Assign groups, Canceled",
      "Send invitations, Canceled",
    ]);
    const retry = page
      .getByTestId("slow")
      .getByRole("button", { name: "Retry from step 2" });
    await expect(retry).toBeFocused();
    await expect(page.locator("[data-testid=slow] [role=status]")).toHaveText(
      "Canceled, 1 of 4 complete",
    );

    const validated = await page
      .getByTestId("slow")
      .locator("time")
      .first()
      .getAttribute("datetime");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-testid=slow] [role=status]")).toHaveText(
      "All 4 steps complete",
      { timeout: 10_000 },
    );
    expect(
      await page
        .getByTestId("slow")
        .locator("time")
        .first()
        .getAttribute("datetime"),
    ).toBe(validated);
  });

  test("reads each icon as the text color in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    const text = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });

    const fills = await page
      .locator(
        "[data-testid=statuses] .bx--task-status-list__icon svg:not(.bx--loading__svg)",
      )
      .evaluateAll((icons) => icons.map((icon) => getComputedStyle(icon).fill));
    expect(fills.length).toBeGreaterThanOrEqual(5);
    expect(new Set(fills)).toEqual(new Set([text]));
    // The spinner is a ring: a fill would turn it into a disc.
    expect(
      await page
        .locator("[data-testid=statuses] .bx--loading__svg")
        .evaluate((ring) => getComputedStyle(ring).fill),
    ).toBe("rgba(0, 0, 0, 0)");
    expect(
      await page
        .locator("[data-testid=statuses] .bx--loading__stroke")
        .evaluate((arc) => getComputedStyle(arc).stroke),
    ).toBe(text);
  });
});
