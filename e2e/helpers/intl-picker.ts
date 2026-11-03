import type { Locator, Page } from "@playwright/test";
import { expect } from "./host";

// TimezonePicker, CountryPicker and LanguagePicker read the browser's `Intl`
// data, so their tests ask the browser for the list too and check that every
// entry can be found by typing its name.

export type Entry = { query: string; id: string };

/**
 * Types each query into an open picker, in the page and without waiting for
 * a frame, and returns the entries whose option never showed up.
 */
export function missing(field: Locator, entries: Entry[]) {
  return field.evaluate(async (input, entries) => {
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    const lost: string[] = [];
    for (const { query, id } of entries) {
      set?.call(input, query);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      // biome-ignore lint/performance/noAwaitInLoops: one query at a time, so each is answered before the next
      await new Promise((resolve) => setTimeout(resolve));
      const found = document.querySelector(`[role=option][id$="-${id}"]`);
      if (!found) lost.push(`${id} (${query})`);
    }
    return lost;
  }, entries);
}

export async function open(page: Page, name: string) {
  const field = page.getByRole("combobox", { name, exact: true });
  await field.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  return field;
}

export const optionTexts = (page: Page, selector = ".bx--intl-picker__text") =>
  page.getByRole("option").locator(selector).allTextContents();
