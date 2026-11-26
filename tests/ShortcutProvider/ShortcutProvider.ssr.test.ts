// @vitest-environment node
import { findShortcutScope } from "../../src/ShortcutProvider/shortcut-registry.js";
import { renderSSR } from "../utils/ssr";
import ShortcutProviderScope from "./ShortcutProviderScope.test.svelte";

describe("ShortcutProvider server render", () => {
  it("renders the content in a wrapper that adds no box", () => {
    const { document } = renderSSR(ShortcutProviderScope);
    const wrappers = document.querySelectorAll("[data-shortcut-scope]");

    expect(wrappers).toHaveLength(2);
    for (const wrapper of wrappers) {
      expect(wrapper.getAttribute("style")).toBe("display: contents;");
    }
    expect([...wrappers].map((wrapper) => wrapper.id)).toEqual([
      "id-1",
      "id-2",
    ]);
    expect(
      document.querySelector("[data-testid=panel] button")?.textContent,
    ).toBe("Save profile");
  });

  it("holds no provider on the server", () => {
    const { document } = renderSSR(ShortcutProviderScope);
    const button = document.querySelector("button");
    assert(button);

    expect(findShortcutScope(button)).toBeUndefined();
  });
});
