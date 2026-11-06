// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Announcer from "./Announcer.test.svelte";

describe("Announcer server render", () => {
  it("renders both regions empty, with no document needed", () => {
    const { document } = renderSSR(Announcer, { ssrCall: true });

    const polite = document.querySelector('[role="status"]');
    const assertive = document.querySelector('[role="alert"]');
    expect(polite?.getAttribute("aria-live")).toBe("polite");
    expect(assertive?.getAttribute("aria-live")).toBe("assertive");
    expect(polite?.textContent).toBe("");
    expect(assertive?.textContent).toBe("");
  });
});
