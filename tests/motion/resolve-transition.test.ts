// @vitest-environment node
import { resolveTransition } from "../../src/motion/resolve-transition.js";
import type { TransitionFunction } from "../../src/motion/resolve-transition.js";
import { fly, slide, type SlideParams } from "../../src/motion/transitions.js";

const preset: { fn: TransitionFunction; params: SlideParams } = {
  fn: slide,
  params: { axis: "y" },
};

describe("resolveTransition", () => {
  it.each([undefined, false])("%s is off", (prop) => {
    expect(resolveTransition(prop, preset)).toEqual({
      fn: slide,
      params: {},
      animated: false,
    });
  });

  it("true is the preset", () => {
    expect(resolveTransition(true, preset)).toEqual({
      fn: slide,
      params: { axis: "y" },
      animated: true,
    });
  });

  it("an empty object is the preset too", () => {
    expect(resolveTransition({}, preset)).toEqual({
      fn: slide,
      params: { axis: "y" },
      animated: true,
    });
  });

  it("params override the preset's", () => {
    expect(
      resolveTransition({ axis: "x", duration: "slow01" }, preset),
    ).toEqual({
      fn: slide,
      params: { axis: "x", duration: "slow01" },
      animated: true,
    });
  });

  it("fn swaps the transition and drops the preset's params", () => {
    expect(resolveTransition({ fn: fly, y: 8 }, preset)).toEqual({
      fn: fly,
      params: { y: 8 },
      animated: true,
    });
  });

  it("naming the preset's own fn keeps the preset's params", () => {
    expect(resolveTransition({ fn: slide, duration: 90 }, preset)).toEqual({
      fn: slide,
      params: { axis: "y", duration: 90 },
      animated: true,
    });
  });

  it("does not mutate the preset", () => {
    resolveTransition({ axis: "x" }, preset);
    expect(preset.params).toEqual({ axis: "y" });
  });
});
