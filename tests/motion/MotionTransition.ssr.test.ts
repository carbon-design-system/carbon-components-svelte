// @vitest-environment node
import { fly } from "../../src/motion/transitions.js";
import { renderSSR } from "../utils/ssr";
import MotionTransition from "./MotionTransition.test.svelte";

describe("motion server render", () => {
  // The server never runs a transition, so `getComputedStyle` is never called.
  it("a Carbon transition directive renders plain markup", () => {
    const { document } = renderSSR(MotionTransition, {
      transition: fly,
      params: { y: 8, collapse: true },
    });

    const target = document.querySelector("[data-testid=target]");
    expect(target?.textContent?.trim()).toBe("content");
    expect(target).not.toHaveAttribute("style");
  });
});
