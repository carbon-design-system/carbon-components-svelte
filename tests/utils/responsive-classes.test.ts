import { responsiveClasses } from "../../src/utils/responsive-classes.js";

const ALL = ["sm", "md", "lg", "xlg", "max"] as const;

describe("responsiveClasses", () => {
  test("scalar string emits a single class", () => {
    expect(responsiveClasses("bx--stack", "horizontal", ALL)).toEqual([
      "bx--stack-horizontal",
    ]);
  });

  test("breakpoint object emits one class per key, sm unprefixed", () => {
    expect(
      responsiveClasses("bx--stack", { sm: "vertical", md: "horizontal" }, ALL),
    ).toEqual(["bx--stack-vertical", "bx--stack-md-horizontal"]);
  });

  test("boolean breakpoint object maps to presence, false emits an un-prefixed override", () => {
    expect(
      responsiveClasses("bx--btn-set--stacked", { sm: true, lg: false }, ALL),
    ).toEqual(["bx--btn-set--stacked", "bx--btn-set--lg-unstacked"]);
  });

  test("false at sm emits nothing, since that is the implicit default", () => {
    expect(
      responsiveClasses("bx--btn-set--stacked", { sm: false }, ALL),
    ).toEqual([]);
  });

  test("empty object emits no classes", () => {
    expect(responsiveClasses("bx--stack", {}, ALL)).toEqual([]);
  });

  test("keys not in allowed are ignored", () => {
    expect(
      responsiveClasses(
        "bx--stack",
        // @ts-expect-error - unknown breakpoint key
        { sm: "vertical", banana: "horizontal" },
        ALL,
      ),
    ).toEqual(["bx--stack-vertical"]);
  });
});
