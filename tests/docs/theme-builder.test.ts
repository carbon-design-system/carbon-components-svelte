// @vitest-environment node
import {
  parseBuilderState,
  serializeBuilderState,
} from "../../docs/src/theme-builder";

const themes = ["white", "g10", "g80", "g90", "g100"] as const;

describe("theme builder URL state", () => {
  test("round-trips a theme, brand and overrides", () => {
    const state = {
      theme: "g10" as const,
      brand: "#501214",
      overrides: "text-primary: #363534\nlayer-01: rgba(0, 0, 0, 0.1);",
    };
    const query = serializeBuilderState(state);
    expect(query).toBe(
      "theme=g10&brand=501214&tokens=text-primary:363534;layer-01:rgba(0,%200,%200,%200.1)",
    );
    expect(parseBuilderState(new URLSearchParams(query), themes)).toEqual({
      ...state,
      overrides: "text-primary: #363534\nlayer-01: rgba(0, 0, 0, 0.1)",
    });
  });

  test("drops an unknown theme and accepts a brand with a #", () => {
    expect(
      parseBuilderState(new URLSearchParams("theme=g50&brand=%23abc"), themes),
    ).toEqual({ brand: "#abc" });
  });
});
