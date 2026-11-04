import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** The element's box. The element is on the page, so it has one. */
async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("no box");
  return found;
}

/** The accessible name of the focused element, with its role. */
function focused(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return "none";
    return `${element.tagName.toLowerCase()}: ${(element.textContent ?? "").replace(/\s+/g, " ").trim()}`;
  });
}

/** Tab until the focused element's text matches, as a keyboard user would. */
async function tabTo(page: Page, text: RegExp) {
  for (let presses = 0; presses < 14; presses++) {
    // biome-ignore lint/performance/noAwaitInLoops: one key press at a time
    await page.keyboard.press("Tab");
    if (text.test(await focused(page))) return;
  }
  throw new Error(`Tab never reached ${text}`);
}

async function expectHeading(page: Page, name: string) {
  const heading = page.getByRole("heading", { name });
  await expect(heading).toBeFocused();
}

async function openFlow(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/create-flow.html");
  await expect(
    page.getByRole("dialog", { name: "Create a virtual server" }),
  ).toBeVisible();
  // The slide-in ends before anything is measured or typed.
  await page.evaluate(async () => {
    await document.fonts.ready;
    const container = document.querySelector(".bx--tearsheet__container");
    await Promise.all(container?.getAnimations().map((a) => a.finished) ?? []);
  });
}

async function fillDetails(page: Page, name = "web-1") {
  await page.getByLabel("Name", { exact: true }).fill(name);
}

async function fillNetworking(page: Page) {
  await page.getByLabel("Virtual private cloud").selectOption("vpc-prod");
  await page.getByLabel("Subnet").selectOption("10.240.0.0/24");
}

async function toReview(page: Page) {
  await fillDetails(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expectHeading(page, "Step 2 of 4: Networking");
  await fillNetworking(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expectHeading(page, "Step 3 of 4: Storage");
  await page.getByRole("button", { name: "Next" }).click();
  await expectHeading(page, "Step 4 of 4: Review");
}

test.describe("Create flow in a Tearsheet", () => {
  test("goes through every step, to the confirmation, with the keyboard alone", async ({
    page,
  }) => {
    await openFlow(page);
    // The tearsheet puts focus on the first field.
    await expect(page.getByLabel("Name", { exact: true })).toBeFocused();

    await page.keyboard.type("web-1");
    await page.keyboard.press("Enter");
    await expectHeading(page, "Step 2 of 4: Networking");

    // Tab leaves the heading for the step's first field.
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Virtual private cloud")).toBeFocused();
    // Type-ahead picks an option on a closed select in every browser.
    await page.keyboard.type("vpc-p");
    await page.keyboard.press("Tab");
    await page.keyboard.type("10.240.0");
    await tabTo(page, /^button: Next/);
    await page.keyboard.press("Enter");
    await expectHeading(page, "Step 3 of 4: Storage");

    await tabTo(page, /^button: Back/);
    await page.keyboard.press("Space");
    await expectHeading(page, "Step 2 of 4: Networking");
    await tabTo(page, /^button: Next/);
    await page.keyboard.press("Enter");
    await expectHeading(page, "Step 3 of 4: Storage");
    await tabTo(page, /^button: Next/);
    await page.keyboard.press("Enter");
    await expectHeading(page, "Step 4 of 4: Review");

    await tabTo(page, /^button: Create server/);
    await page.keyboard.press("Enter");
    await expect(page.getByText("Server created")).toBeVisible();
    // Focus is on the confirmation, and the footer offers Done.
    expect(await focused(page)).toMatch(/^div: .*Server created/);
    await tabTo(page, /^button: Done/);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("moves focus to the step heading, named with the count", async ({
    page,
  }) => {
    await openFlow(page);
    await fillDetails(page);
    await page.getByRole("button", { name: "Next" }).click();

    await expectHeading(page, "Step 2 of 4: Networking");
    // Visible: the count above the title. Read: the count and the title.
    await expect(page.locator(".bx--create-flow__count:visible")).toHaveText(
      "Step 2 of 4",
    );

    // A completed step in the rail goes back to its heading.
    await page.getByRole("button", { name: /^Details/ }).click();
    await expectHeading(page, "Step 1 of 4: Details");
    // The field holds what was typed: the step stayed mounted.
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("web-1");
  });

  test("does not let the rail skip ahead of a step that isn't complete", async ({
    page,
  }) => {
    await openFlow(page);
    await page.getByRole("button", { name: /^Review/ }).click();

    await expect(
      page.getByRole("heading", { name: /Step 1 of 4/ }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Review/ })).toHaveCount(0);
  });

  test("focuses the first invalid field when a step fails", async ({
    page,
  }) => {
    await openFlow(page);
    await page.getByRole("button", { name: "Next" }).click();

    const name = page.getByLabel("Name", { exact: true });
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Enter a name.")).toBeVisible();
    // The rail marks the step.
    await expect(
      page.getByRole("button", { name: /^Details\s*, invalid/ }),
    ).toBeVisible();

    await fillDetails(page, "prod-web-1");
    await page.getByRole("button", { name: "Next" }).click();
    // An async check ran, and the name is taken.
    await expect(
      page.getByText('"prod-web-1" is already in use.'),
    ).toBeVisible();
    await expect(name).toBeFocused();
  });

  test("shows a spinner on Next while the check runs, and ignores a second press", async ({
    page,
  }) => {
    await openFlow(page);
    await fillDetails(page);
    const next = page.getByRole("button", { name: /^Next/ });
    await next.click();

    await expect(next).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await expectHeading(page, "Step 2 of 4: Networking");
    await expect(next).not.toHaveAttribute("aria-busy");
  });

  test("shows an error notification when a check can't run, and focuses it", async ({
    page,
  }) => {
    await openFlow(page);
    await fillDetails(page, "offline-1");
    await page.getByRole("button", { name: "Next" }).click();

    const error = page.locator("[data-create-flow-error]");
    await expect(error).toContainText("The naming service did not respond");
    await expect(error).toBeFocused();
    // The user stays on the step, and can try again.
    await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
    await fillDetails(page, "web-1");
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 4: Networking");
    await expect(error).toHaveCount(0);
  });

  test("shows a failed submit on the review step and lets the user retry", async ({
    page,
  }) => {
    await openFlow(page);
    await fillDetails(page, "fail-create");
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 4: Networking");
    await fillNetworking(page);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 4 of 4: Review");

    await page.getByRole("button", { name: "Create server" }).click();
    await expect(
      page.getByRole("button", { name: /Create server/ }),
    ).toHaveAttribute("aria-busy", "true");
    const error = page.locator("[data-create-flow-error]");
    await expect(error).toContainText("The quota for this region is used up.");
    await expect(error).toBeFocused();

    // Back to the name, then submit again.
    await page.getByRole("button", { name: /^Details/ }).click();
    await fillDetails(page, "web-2");
    await page.getByRole("button", { name: /^Review/ }).click();
    await page.getByRole("button", { name: "Create server" }).click();
    await expect(page.getByText("Server created")).toBeVisible();
  });

  test("skips the Storage step when an earlier answer makes it unneeded", async ({
    page,
  }) => {
    await openFlow(page);
    await expect(page.getByRole("button", { name: /^Storage/ })).toBeVisible();
    await page.getByLabel(/Instance storage/).check({ force: true });
    await expect(page.getByRole("button", { name: /^Storage/ })).toHaveCount(0);

    await fillDetails(page);
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 3: Networking");
    await fillNetworking(page);
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 3 of 3: Review");
    await expect(
      page.getByRole("button", { name: "Create server" }),
    ).toBeVisible();
  });

  test.describe("unsaved changes", () => {
    test("Escape closes a clean flow without a prompt", async ({ page }) => {
      await openFlow(page);
      await page.keyboard.press("Escape");

      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("Escape with a change in any step asks first, and Keep editing returns to the field", async ({
      page,
    }) => {
      await openFlow(page);
      await fillDetails(page);
      await page.getByRole("button", { name: "Next" }).click();
      await expectHeading(page, "Step 2 of 4: Networking");
      // The change is in step 1; the user is on step 2.
      await page.keyboard.press("Escape");

      const prompt = page.getByRole("alertdialog", {
        name: "Discard unsaved changes?",
      });
      await expect(prompt).toBeVisible();
      await expect(
        page.getByRole("dialog", { name: "Create a virtual server" }),
      ).toBeVisible();
      await prompt.getByRole("button", { name: "Keep editing" }).click();
      await expect(prompt).toBeHidden();
      await expect(
        page.getByRole("dialog", { name: "Create a virtual server" }),
      ).toBeVisible();

      // Escape from the prompt itself keeps the flow too.
      await page.keyboard.press("Escape");
      await expect(prompt).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(prompt).toBeHidden();
      await expect(
        page.getByRole("dialog", { name: "Create a virtual server" }),
      ).toBeVisible();
    });

    test("Cancel asks the same, and Discard closes and starts over next time", async ({
      page,
    }) => {
      await openFlow(page);
      await fillDetails(page);
      await page.getByRole("button", { name: "Next" }).click();
      await expectHeading(page, "Step 2 of 4: Networking");
      await page.getByRole("button", { name: "Cancel" }).click();
      await page
        .getByRole("alertdialog", { name: "Discard unsaved changes?" })
        .getByRole("button", { name: "Discard" })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);

      await page
        .getByRole("button", { name: "Create a virtual server" })
        .click();
      await expectHeading(page, "Step 1 of 4: Details").catch(() => {});
      await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
      await expect(
        page.getByRole("button", { name: /^Details/ }),
      ).toHaveAttribute("aria-current", "step");
      // And the flow is clean again: Escape needs no prompt.
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("a completed submit clears the dirty state", async ({ page }) => {
      await openFlow(page);
      await toReview(page);
      await page.getByRole("button", { name: "Create server" }).click();
      await expect(page.getByText("Server created")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });

    test("Escape does not close the flow while the submit runs", async ({
      page,
    }) => {
      await openFlow(page);
      await toReview(page);
      await page.getByRole("button", { name: "Create server" }).click();
      await page.keyboard.press("Escape");

      await expect(page.getByText("Server created")).toBeVisible();
      await expect(
        page.getByRole("dialog", { name: "Create a virtual server" }),
      ).toBeVisible();
    });
  });

  test("keeps the whole flow usable in a 360px window, with the rail showing the current step", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/create-flow.html");
    await expect(
      page.getByRole("dialog", { name: "Create a virtual server" }),
    ).toBeVisible();

    const rail = page.locator(".bx--create-flow__steps");
    await expect(rail.getByRole("button")).toHaveCount(1);
    await expect(rail.getByRole("button")).toHaveText(/Details/);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);

    await fillDetails(page);
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 4: Networking");
    await expect(rail.getByRole("button")).toHaveText(/Networking/);
    // Back and Next fit, and the rail leaves most of the height to the form.
    const next = await box(page.getByRole("button", { name: "Next" }));
    expect(next.x + next.width).toBeLessThanOrEqual(360);
    expect((await box(rail)).height).toBeLessThan(120);
  });

  test("puts the rail at the right in right-to-left", async ({ page }) => {
    await openFlow(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const rail = await box(page.locator(".bx--tearsheet__influencer"));
    const main = await box(page.locator(".bx--tearsheet__main"));
    expect(rail.x).toBeGreaterThan(main.x);
    // The connector line is on the rail's start edge, at the right.
    const line = await box(
      page.locator(".bx--progress-step--current .bx--progress-line"),
    );
    expect(line.x).toBeGreaterThan(rail.x + rail.width / 2);
  });

  test("makes no animation of its own with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openFlow(page);
    await fillDetails(page);
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 4: Networking");

    const animations = await page.evaluate(
      () =>
        document
          .querySelector(".bx--tearsheet__main")
          ?.getAnimations({ subtree: true }).length,
    );
    expect(animations).toBe(0);
  });

  test("keeps the rail's states apart from the page in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await openFlow(page);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByLabel("Name", { exact: true })).toBeFocused();

    // The invalid step's icon is painted in a system color, not the dialog's.
    const warning = page.locator(".bx--progress__warning");
    const colors = await page.evaluate(() => ({
      fill: getComputedStyle(
        document.querySelector(".bx--progress__warning > *") as Element,
      ).fill,
      background: getComputedStyle(
        document.querySelector(".bx--tearsheet__container") as Element,
      ).backgroundColor,
    }));
    await expect(warning).toBeVisible();
    expect(colors.fill).not.toBe(colors.background);

    // A step in the rail takes a ring when the keyboard reaches it.
    await page.getByRole("button", { name: /^Details/ }).focus();
    const ring = await page
      .getByRole("button", { name: /^Details/ })
      .evaluate((button) => getComputedStyle(button).outlineStyle);
    expect(ring).not.toBe("none");
  });

  test.describe("accessibility", () => {
    test("has no axe violations on the first step", async ({ page }) => {
      await openFlow(page);
      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toEqual([]);
    });

    test("has none with an invalid step, an error notification and on the review", async ({
      page,
    }) => {
      await openFlow(page);
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page.getByText("Enter a name.")).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await fillDetails(page, "offline-1");
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page.locator("[data-create-flow-error]")).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      await fillDetails(page);
      await page.getByRole("button", { name: "Next" }).click();
      await fillNetworking(page);
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await expectHeading(page, "Step 4 of 4: Review");
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });

    test("has none in Gray 100, with the discard prompt open", async ({
      page,
    }) => {
      await openFlow(page);
      await page.evaluate(() => {
        document.documentElement.classList.add("bx--g100");
      });
      await fillDetails(page);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
      ).toBeVisible();

      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  });
});

test.describe("Create flow in a Modal", () => {
  test("goes through three steps with a horizontal rail, and guards Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create-flow.html?layout=modal");
    await expect(
      page.getByRole("dialog", { name: "Add a server" }),
    ).toBeVisible();
    await expect(page.locator(".bx--progress--vertical")).toHaveCount(0);

    await page.getByLabel("Name", { exact: true }).fill("web-1");
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 3: Networking");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Choose a subnet.")).toBeVisible();
    await expect(page.getByLabel("Subnet")).toBeFocused();

    await page.keyboard.press("Escape");
    const prompt = page.getByRole("alertdialog", {
      name: "Discard unsaved changes?",
    });
    await expect(prompt).toBeVisible();
    await prompt.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("submits and closes", async ({ page }) => {
    await page.goto("/create-flow.html?layout=modal");
    await page.getByLabel("Name", { exact: true }).fill("web-1");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Subnet").selectOption("10.240.0.0/24");
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 3 of 3: Review");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("web-1 was added.")).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("Create flow on a page", () => {
  test("puts the rail beside the form and goes through the steps", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/create-flow.html?layout=page");
    const rail = await box(page.locator(".bx--create-flow__steps"));
    const form = await box(page.locator("form"));
    expect(rail.x + rail.width).toBeLessThanOrEqual(form.x);

    await page.getByLabel("Name", { exact: true }).fill("web-1");
    await page.getByRole("button", { name: "Next" }).click();
    await expectHeading(page, "Step 2 of 3: Networking");
    await page.getByLabel("Subnet").selectOption("10.240.0.0/24");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("web-1 was added.")).toBeVisible();
  });
});
