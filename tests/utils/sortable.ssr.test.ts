// @vitest-environment node
import Sortable from "./sortable.ssr.test.svelte";
import { renderSSR } from "./ssr";

describe("sortable (SSR)", () => {
  it("renders the plain list; the action adds nothing until it runs", () => {
    const { document } = renderSSR(Sortable);

    expect(document.querySelectorAll("li")).toHaveLength(3);
    expect(document.querySelector("[role='status']")).toBeNull();
    expect(document.querySelector("[tabindex]")).toBeNull();
    expect(document.querySelector("[aria-roledescription]")).toBeNull();
    expect(document.querySelector("[aria-describedby]")).toBeNull();
  });
});
