// @vitest-environment node
import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";
import InterstitialScreenSsr from "./InterstitialScreenSsr.test.svelte";
import InterstitialScreenSteps from "./InterstitialScreenSteps.test.svelte";

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

  it("shows only the first of several steps", () => {
    const { document } = renderSSR(InterstitialScreenSteps);
    const views = [
      ...document.querySelectorAll(".bx--interstitial-screen-view"),
    ];

    expect(views.map((view) => view.hasAttribute("hidden"))).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("shows a single step", () => {
    const { document } = renderSSR(InterstitialScreenSsr);

    expect(
      document.querySelector(".bx--interstitial-screen-view"),
    ).not.toHaveAttribute("hidden");
  });
});
