import {
  createStepState,
  getStepFlags,
  goToStep,
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
  setStepComplete,
  setStepDisabled,
  setStepIds,
  setStepInvalid,
} from "../../src/utils/step-state.js";

describe("createStepState", () => {
  test("clamps currentIndex into range", () => {
    expect(createStepState(["a", "b", "c"], 9).currentIndex).toBe(2);
  });

  test("empty ids clamps to -1", () => {
    expect(createStepState([]).currentIndex).toBe(-1);
  });
});

describe("setStepIds", () => {
  test("removing an id before the current keeps the same current id and lowers the index", () => {
    const state = createStepState(["a", "b", "c"], 2);
    const next = setStepIds(state, ["b", "c"]);
    expect(next.ids).toEqual(["b", "c"]);
    expect(next.currentIndex).toBe(1);
  });

  test("removing the current id clamps to the same index (next step)", () => {
    const state = createStepState(["a", "b", "c"], 1);
    const next = setStepIds(state, ["a", "c"]);
    expect(next.currentIndex).toBe(1);
    expect(next.ids[next.currentIndex]).toBe("c");
  });

  test("removing the current id at the end clamps to the last", () => {
    const state = createStepState(["a", "b", "c"], 2);
    const next = setStepIds(state, ["a", "b"]);
    expect(next.currentIndex).toBe(1);
  });

  test("appending keeps the index", () => {
    const state = createStepState(["a", "b"], 1);
    const next = setStepIds(state, ["a", "b", "c"]);
    expect(next.currentIndex).toBe(1);
  });

  test("prunes completed/invalid/disabled sets for removed ids", () => {
    let state = createStepState(["a", "b", "c"], 0);
    state = setStepComplete(state, "b");
    state = setStepInvalid(state, "c");
    state = setStepDisabled(state, "b");
    const next = setStepIds(state, ["a", "c"]);
    expect(next.completed.has("b")).toBe(false);
    expect(next.invalid.has("c")).toBe(true);
    expect(next.disabled.has("b")).toBe(false);
  });

  test("returns the same reference when ids are shallow-equal and nothing was pruned", () => {
    const state = createStepState(["a", "b", "c"], 0);
    expect(setStepIds(state, ["a", "b", "c"])).toBe(state);
  });
});

describe("goToStep", () => {
  test("clamps out-of-range indices", () => {
    const state = createStepState(["a", "b", "c"], 0);
    expect(goToStep(state, 9).currentIndex).toBe(2);
  });

  test("returns the same reference for a disabled target", () => {
    let state = createStepState(["a", "b", "c"], 0);
    state = setStepDisabled(state, "b");
    expect(goToStep(state, 1)).toBe(state);
  });

  test("returns the same reference for the same index", () => {
    const state = createStepState(["a", "b", "c"], 1);
    expect(goToStep(state, 1)).toBe(state);
  });
});

describe("nextStep / previousStep", () => {
  test("nextStep skips a disabled middle step", () => {
    let state = createStepState(["a", "b", "c"], 0);
    state = setStepDisabled(state, "b");
    const next = nextStep(state);
    expect(next.ids[next.currentIndex]).toBe("c");
  });

  test("previousStep skips a disabled middle step", () => {
    let state = createStepState(["a", "b", "c"], 2);
    state = setStepDisabled(state, "b");
    const prev = previousStep(state);
    expect(prev.ids[prev.currentIndex]).toBe("a");
  });

  test("nextStep stops at the end", () => {
    const state = createStepState(["a", "b"], 1);
    expect(nextStep(state)).toBe(state);
  });

  test("previousStep stops at the start", () => {
    const state = createStepState(["a", "b"], 0);
    expect(previousStep(state)).toBe(state);
  });
});

describe("isFirstStep / isLastStep", () => {
  test("treat trailing disabled steps as the end", () => {
    let state = createStepState(["a", "b", "c"], 1);
    state = setStepDisabled(state, "c");
    expect(isLastStep(state)).toBe(true);
  });

  test("treat leading disabled steps as the start", () => {
    let state = createStepState(["a", "b", "c"], 1);
    state = setStepDisabled(state, "a");
    expect(isFirstStep(state)).toBe(true);
  });

  test("both true for an empty state", () => {
    const state = createStepState([]);
    expect(isFirstStep(state)).toBe(true);
    expect(isLastStep(state)).toBe(true);
  });
});

describe("flag setters", () => {
  test("toggle membership", () => {
    let state = createStepState(["a", "b"], 0);
    state = setStepComplete(state, "a");
    expect(state.completed.has("a")).toBe(true);
    state = setStepComplete(state, "a", false);
    expect(state.completed.has("a")).toBe(false);
  });

  test("no-op when the flag already matches", () => {
    let state = createStepState(["a", "b"], 0);
    state = setStepInvalid(state, "a", true);
    expect(setStepInvalid(state, "a", true)).toBe(state);
  });

  test("no-op for an unknown id", () => {
    const state = createStepState(["a", "b"], 0);
    expect(setStepDisabled(state, "z", true)).toBe(state);
  });
});

describe("getStepFlags", () => {
  test("reports index -1 for an unknown id", () => {
    const state = createStepState(["a", "b"], 0);
    expect(getStepFlags(state, "z").index).toBe(-1);
  });

  test("reports current for the active step", () => {
    let state = createStepState(["a", "b"], 1);
    state = setStepComplete(state, "b");
    const flags = getStepFlags(state, "b");
    expect(flags.current).toBe(true);
    expect(flags.complete).toBe(true);
    expect(flags.index).toBe(1);
  });
});
