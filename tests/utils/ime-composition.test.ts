// @vitest-environment node
import { isImeComposition } from "../../src/utils/ime-composition.js";

const keydown = (init: Partial<KeyboardEvent>) =>
  ({
    key: "Escape",
    isComposing: false,
    keyCode: 27,
    ...init,
  }) as KeyboardEvent;

describe("isImeComposition", () => {
  it("is true while composing", () => {
    expect(isImeComposition(keydown({ isComposing: true }))).toBe(true);
  });

  it("is true for Safari's keyCode 229 after the composition ended", () => {
    expect(isImeComposition(keydown({ keyCode: 229 }))).toBe(true);
  });

  it("is false for a plain Escape", () => {
    expect(isImeComposition(keydown({}))).toBe(false);
  });
});
