import { expect, test } from "./helpers/host";

// The family variables swap the font everywhere Carbon names Plex. Set
// on `:root`, they reach the code tokens too.
test("the family variables replace Plex", async ({ page }) => {
  await page.goto("/code-snippet.html");
  const snippet = page.locator(".bx--snippet code").first();
  await expect(snippet).toBeVisible();

  const families = () =>
    page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      code: getComputedStyle(
        document.querySelector(".bx--snippet code") as Element,
      ).fontFamily,
    }));

  expect(await families()).toMatchObject({
    body: expect.stringMatching(/^"IBM Plex Sans"/),
    code: expect.stringMatching(/^"IBM Plex Mono"/),
  });

  await page.evaluate(() => {
    document.documentElement.style.setProperty("--ccs-font-sans", "Georgia");
    document.documentElement.style.setProperty("--ccs-font-mono", "Courier");
  });
  expect(await families()).toEqual({ body: "Georgia", code: "Courier" });
});
