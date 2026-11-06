// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import InlineSuggest from "./InlineSuggest.ssr.test.svelte";

describe("InlineSuggest on the server", () => {
  it("renders the hint and the live region, and leaves the field and the page untouched", () => {
    const { document } = renderSSR(InlineSuggest);
    const field = document.querySelector("input");

    expect(field?.hasAttribute("aria-autocomplete")).toBe(false);
    expect(
      document.querySelector(".bx--visually-hidden[id$='-hint']")?.textContent,
    ).toMatch(/Suggestions appear as you type/);
    expect(
      document.querySelector("[aria-live=polite]")?.textContent?.trim(),
    ).toBe("");
    expect(document.querySelector(".bx--inline-suggest")).toBeNull();
  });
});
