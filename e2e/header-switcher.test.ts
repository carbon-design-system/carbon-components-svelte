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
