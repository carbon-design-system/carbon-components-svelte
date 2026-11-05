// @vitest-environment node
import Sortable from "./sortable.ssr.test.svelte";
import { renderSSR } from "./ssr";

describe("sortable and sortableTree (SSR)", () => {
  it("render the plain markup; the actions add nothing until they run", () => {
    const { document } = renderSSR(Sortable);

    expect(document.querySelectorAll("li")).toHaveLength(6);
    expect(document.querySelector("[role='status']")).toBeNull();
    expect(document.querySelector("[tabindex]")).toBeNull();
    expect(document.querySelector("[aria-roledescription]")).toBeNull();
    expect(document.querySelector("[aria-describedby]")).toBeNull();
    expect(document.querySelector("[aria-keyshortcuts]")).toBeNull();
  });
});
