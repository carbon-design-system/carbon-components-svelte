// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Announcer from "./Announcer.test.svelte";

describe("Announcer server render", () => {
  it("renders the region empty, and an announce() at init does nothing", () => {
    const { document } = renderSSR(Announcer, { ssrCall: true });

    const region = document.querySelector('[role="status"]');
    expect(region?.getAttribute("aria-live")).toBe("polite");
    expect(region?.textContent).toBe("");
  });
});
