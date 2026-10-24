// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Prose from "./Prose.ssr.test.svelte";

describe("Prose server render", () => {
  it("renders the tag, variant class, max width and slotted copy", () => {
    const { document } = renderSSR(Prose, {
      variant: "compact",
      maxWidth: 480,
      tag: "article",
    });
    const prose = document.querySelector("article");

    assert(prose);
    expect([...prose.classList]).toEqual(["bx--prose", "bx--prose--compact"]);
    expect(prose.getAttribute("style")).toBe("max-width: 480px;");
    expect(prose.querySelector("h2")?.textContent).toBe("Overview");
    expect(prose.querySelector("p")?.textContent).toBe("Body copy");
  });
});
