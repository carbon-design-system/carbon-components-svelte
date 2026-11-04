import { expect, test } from "./helpers/host";

/**
 * A radio button outside a group starts where its box starts, as a
 * checkbox does, and only its circle and text take clicks.
 */
test("a radio button outside a group sits at the start of its box", async ({
  page,
}) => {
  await page.goto("/radio-button-lone.html");

  for (const id of ["lone", "lone-label-left"]) {
    const box = page.getByTestId(id);
    const wrapper = await box.boundingBox();
    const label = await box.locator(".bx--radio-button__label").boundingBox();
    // Where the circle or the text, whichever comes first, starts.
    const start = await box
      .locator(".bx--radio-button__label > *")
      .evaluateAll((parts) =>
        Math.min(...parts.map((part) => part.getBoundingClientRect().left)),
      );
    expect.soft(wrapper && label, `${id} rendered`).toBeTruthy();
    if (!wrapper || !label) continue;

    expect.soft(start - wrapper.x, `${id} starts at the box`).toBeLessThan(4);
    expect.soft(label.width, `${id} fits its content`).toBeLessThan(120);
  }
});
