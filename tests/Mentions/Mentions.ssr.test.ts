// @vitest-environment node
import { getCaretCoordinates } from "../../src/Mentions/caret-position.js";
import { renderSSR } from "../utils/ssr";
import Mentions from "./Mentions.ssr.test.svelte";

describe("Mentions on the server", () => {
  it("renders only the live region and leaves the field untouched", () => {
    const { document } = renderSSR(Mentions);
    const field = document.querySelector("textarea");

    expect(field).not.toBeNull();
    expect(field?.hasAttribute("aria-autocomplete")).toBe(false);
    expect(
      document.querySelector("[aria-live=polite]")?.textContent?.trim(),
    ).toBe("");
    expect(document.querySelector("[role=listbox]")).toBeNull();
    expect(document.querySelector(".bx--mentions__anchor")).toBeNull();
  });

  it("measures nothing without a document", () => {
    expect(getCaretCoordinates({} as HTMLTextAreaElement, 0)).toBeNull();
  });
});
