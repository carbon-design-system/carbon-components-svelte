// @vitest-environment node
import { render } from "svelte/server";
import { renderSSR, stripHydrationMarkers } from "../utils/ssr";
import TokenSearch from "./TokenSearch.ssr.test.svelte";

describe("TokenSearch on the server", () => {
  it("renders the field with its value and the layer hidden until it is placed", () => {
    const { document } = renderSSR(TokenSearch);
    const field = document.querySelector("input");

    expect(field?.getAttribute("role")).toBe("combobox");
    expect(field?.getAttribute("aria-expanded")).toBe("false");
    expect((field as HTMLInputElement).value).toBe("is:open nope:1");
    const layer = document.querySelector(".bx--token-search__backdrop");
    expect(layer?.hasAttribute("hidden")).toBe(true);
    // `renderSSR` drops whitespace between tags; the layer needs it.
    expect(stripHydrationMarkers(render(TokenSearch).body)).toMatch(
      /<\/span><\/span> <span/,
    );
    expect(document.querySelector("[role=listbox]")).toBeNull();
    expect(document.querySelector(".bx--token-search__anchor")).toBeNull();
  });

  it("names the problems for a screen reader in the markup it sends", () => {
    const { document } = renderSSR(TokenSearch);
    const field = document.querySelector("input");
    const described = document.getElementById(
      field?.getAttribute("aria-describedby") ?? "",
    );
    expect(described?.textContent).toContain("Unknown key");
  });
});
