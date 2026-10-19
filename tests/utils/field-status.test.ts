// @vitest-environment node
import {
  buildFieldIds,
  joinDescribedBy,
  resolveStatusDescribedBy,
  resolveValidationVisibility,
} from "../../src/utils/field-status.js";

describe("resolveValidationVisibility", () => {
  it.each([
    [
      { invalid: false, warn: false, disabled: false, readonly: false },
      { showInvalid: false, showWarn: false },
    ],
    [
      { invalid: true, warn: false, disabled: false, readonly: false },
      { showInvalid: true, showWarn: false },
    ],
    [
      { invalid: false, warn: true, disabled: false, readonly: false },
      { showInvalid: false, showWarn: true },
    ],
    [
      { invalid: true, warn: true, disabled: false, readonly: false },
      { showInvalid: true, showWarn: false },
    ],
    [
      { invalid: true, warn: false, disabled: true, readonly: false },
      { showInvalid: false, showWarn: false },
    ],
    [
      { invalid: true, warn: false, disabled: false, readonly: true },
      { showInvalid: false, showWarn: false },
    ],
    [
      { invalid: false, warn: true, disabled: true, readonly: false },
      { showInvalid: false, showWarn: false },
    ],
    [
      { invalid: false, warn: true, disabled: false, readonly: true },
      { showInvalid: false, showWarn: false },
    ],
  ])("resolves %o -> %o", (options, expected) => {
    expect(resolveValidationVisibility(options)).toEqual(expected);
  });
});

describe("buildFieldIds", () => {
  it("derives ids from the field id", () => {
    expect(buildFieldIds("x")).toEqual({
      helperId: "helper-x",
      errorId: "error-x",
      warnId: "warn-x",
      readonlyId: "readonly-x",
    });
  });

  it("uses fallback ids when id is falsy", () => {
    const fallback = {
      helperId: "h1",
      errorId: "e1",
      warnId: "w1",
      readonlyId: "r1",
    };
    expect(buildFieldIds("", fallback)).toEqual(fallback);
  });

  it("returns undefined fields when id and fallback are both absent", () => {
    expect(buildFieldIds()).toEqual({
      helperId: undefined,
      errorId: undefined,
      warnId: undefined,
      readonlyId: undefined,
    });
  });
});

describe("joinDescribedBy", () => {
  it.each<[Array<string | null | undefined | false>, string | undefined]>([
    [
      ["readonly-x", "selection-x", "error-x"],
      "readonly-x selection-x error-x",
    ],
    [["readonly-x", null, undefined, false, "error-x"], "readonly-x error-x"],
    [[null, undefined, false], undefined],
  ])("joinDescribedBy(...%o) -> %o", (ids, expected) => {
    expect(joinDescribedBy(...ids)).toBe(expected);
  });
});

describe("resolveStatusDescribedBy", () => {
  const base = {
    errorId: "error-x",
    warnId: "warn-x",
    helperId: "helper-x",
    invalidText: "Required",
    warnText: "Careful",
  };

  it("prioritizes invalid over warn over helper", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: true,
        showWarn: true,
        helperText: "help",
      }),
    ).toBe("error-x");
  });

  it("falls back to warn when not invalid", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        helperText: "help",
      }),
    ).toBe("warn-x");
  });

  it("falls back to helper when neither invalid nor warn", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: false,
        helperText: "help",
      }),
    ).toBe("helper-x");
  });

  it("returns undefined when nothing applies", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: false,
        helperText: "",
      }),
    ).toBeUndefined();
  });

  it("isFluid suppresses only the helper fallback by default", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        helperText: "help",
        isFluid: true,
      }),
    ).toBe("warn-x");
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: false,
        helperText: "help",
        isFluid: true,
      }),
    ).toBeUndefined();
  });

  it("includeErrorId=false skips the invalid tier, but showInvalid still suppresses helper", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: true,
        showWarn: false,
        helperText: "help",
        includeErrorId: false,
      }),
    ).toBeUndefined();
  });

  it("skips a message without text, without falling back to helper", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: true,
        showWarn: false,
        invalidText: "",
        helperText: "help",
      }),
    ).toBeUndefined();
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        warnText: "",
        helperText: "help",
      }),
    ).toBeUndefined();
  });
});
