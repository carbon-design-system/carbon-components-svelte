import { expect, test } from "./helpers/host";

// The trigger sits outside HeaderUtilities, where header actions get the
// header's text color. Without its own rule it kept the browser's button
// color: black in a light page, so black on the classic header's dark bar.
function colors(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const trigger = document.querySelector(".bx--header-switcher__trigger");
    const header = trigger?.closest(".bx--header");
    if (!trigger || !header) throw new Error("no HeaderSwitcher in a Header");
    return {
      trigger: getComputedStyle(trigger).color,
      header: getComputedStyle(header).color,
    };
  });
}

test("the classic header's switcher text takes the header's color", async ({
  page,
}) => {
  await page.goto("/uishell-classic.html");
  const { trigger, header } = await colors(page);
  expect(trigger).toBe(header);
});

for (const theme of ["white", "g100"]) {
  test(`the switcher text takes the header's color in ${theme}`, async ({
    page,
  }) => {
    await page.goto("/header-switcher.html");
    await page.evaluate(
      (theme) => document.documentElement.setAttribute("theme", theme),
      theme,
    );
    const { trigger, header } = await colors(page);
    expect(trigger).toBe(header);
  });
}

// The menu hangs from the trigger's start edge and stays on screen: a
// physical `left: 0` opened it on the wrong edge in a right-to-left page and
// ran it off the far edge on a narrow screen.
function edges(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const trigger = document
      .querySelector(".bx--header-switcher__trigger")
      ?.getBoundingClientRect();
    const menu = document
      .querySelector(".bx--header-switcher__menu")
      ?.getBoundingClientRect();
    if (!trigger || !menu) throw new Error("no open HeaderSwitcher");
    return {
      trigger: { left: trigger.left, right: trigger.right },
      menu: { left: menu.left, right: menu.right },
      width: document.documentElement.clientWidth,
    };
  });
}

test("the menu opens from the trigger's end edge in a right-to-left page", async ({
  page,
}) => {
  await page.goto("/header-switcher.html");
  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
  });
  const { trigger, menu } = await edges(page);
  expect(menu.right).toBeCloseTo(trigger.right, 0);
});

test("the menu stays on a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto("/header-switcher.html");
  const { menu, width } = await edges(page);
  expect(menu.left).toBeGreaterThanOrEqual(0);
  expect(menu.right).toBeLessThanOrEqual(width);
});
