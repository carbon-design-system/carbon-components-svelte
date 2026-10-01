// @vitest-environment node
import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
import { renderSSR } from "../utils/ssr";

describe("InterstitialScreen server render", () => {
  it("renders nothing while closed", () => {
    expect(renderSSR(InterstitialScreen).html).toBe("");
  });

  it("renders an open full-screen takeover", () => {
    const { document } = renderSSR(InterstitialScreen, {
      open: true,
      isFullScreen: true,
    });

    expect(document.querySelector('[role="main"]')).toHaveClass(
      "bx--interstitial-screen--full-screen",
    );
  });
});
