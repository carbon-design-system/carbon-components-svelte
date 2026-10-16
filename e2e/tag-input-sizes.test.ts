import { expect, test } from "@playwright/test";

// An empty TagInput is as tall as a TextInput of the same size. Its tag
// set's hidden "+N" counter stayed in the row (a tooltip rule outranked
// the one taking it out of flow) and wrapped onto a line of its own:
// 51px at xs where a TextInput is 24.
test("an empty TagInput matches TextInput's height at each size", async ({
  page,
}) => {
  await page.goto("/tag-input-sizes.html");
  await expect(page.locator(".bx--tag-input")).toHaveCount(4);

  const heights = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-size]")].map((row) => ({
      size: row.dataset.size,
      tagInput: row.querySelector(".bx--tag-input")?.getBoundingClientRect()
        .height,
      textInput: row.querySelector(".bx--text-input")?.getBoundingClientRect()
        .height,
    })),
  );

  for (const { size, tagInput, textInput } of heights)
    expect(tagInput, size).toBe(textInput);
});
