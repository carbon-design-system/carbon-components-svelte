// @vitest-environment node
import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";
import InterstitialScreenSsr from "./InterstitialScreenSsr.test.svelte";

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

  it("renders identical markup in a modal for an explicit id", () => {
    const renderRaw = () => render(InterstitialScreenSsr).body;

    expect(renderRaw()).toBe(renderRaw());
  });
});
