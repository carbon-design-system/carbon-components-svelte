import {
  buildFieldIds,
  resolveStatusDescribedBy,
  resolveValidationVisibility,
} from "../../src/utils/field-status.js";

describe("resolveValidationVisibility", () => {
  test.each([
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

  test("defaults disabled/readonly to false", () => {
    expect(resolveValidationVisibility({ invalid: true, warn: false })).toEqual(
      {
        showInvalid: true,
        showWarn: false,
      },
    );
  });
});

describe("buildFieldIds", () => {
  test("derives ids from the field id", () => {
    expect(buildFieldIds("x")).toEqual({
      helperId: "helper-x",
      errorId: "error-x",
      warnId: "warn-x",
    });
  });

  test("uses fallback ids when id is falsy", () => {
    const fallback = { helperId: "h1", errorId: "e1", warnId: "w1" };
    expect(buildFieldIds(undefined, fallback)).toEqual(fallback);
    expect(buildFieldIds("", fallback)).toEqual(fallback);
  });

  test("returns undefined fields when id and fallback are both absent", () => {
    expect(buildFieldIds()).toEqual({
      helperId: undefined,
      errorId: undefined,
      warnId: undefined,
    });
  });
});

describe("resolveStatusDescribedBy", () => {
  const base = { errorId: "error-x", warnId: "warn-x", helperId: "helper-x" };

  test("prioritizes invalid over warn over helper", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: true,
        showWarn: true,
        helperText: "help",
      }),
    ).toBe("error-x");
  });

  test("falls back to warn when not invalid", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        helperText: "help",
      }),
    ).toBe("warn-x");
  });

  test("falls back to helper when neither invalid nor warn", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: false,
        helperText: "help",
      }),
    ).toBe("helper-x");
  });

  test("returns undefined when nothing applies", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: false,
        helperText: "",
      }),
    ).toBeUndefined();
  });

  test("isFluid suppresses only the helper fallback by default", () => {
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

  test("hideWarnWhenFluid also suppresses the warn id while fluid", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        helperText: "help",
        isFluid: true,
        hideWarnWhenFluid: true,
      }),
    ).toBeUndefined();
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        helperText: "help",
        isFluid: false,
        hideWarnWhenFluid: true,
      }),
    ).toBe("warn-x");
  });

  test("includeErrorId=false skips the invalid tier, but showInvalid still suppresses helper", () => {
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

  test("requireWarnText fall-through still reaches helper once warn is false", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: false,
        warnText: "",
        helperText: "help",
        requireWarnText: true,
      }),
    ).toBe("helper-x");
  });

  test("requireInvalidText fall-through does not reach helper while showInvalid is true", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: true,
        showWarn: false,
        invalidText: "",
        helperText: "help",
        requireInvalidText: true,
      }),
    ).toBeUndefined();
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        warnText: "",
        helperText: "help",
        requireWarnText: true,
      }),
    ).toBeUndefined();
  });

  test("requireInvalidText/requireWarnText pass through when text is present", () => {
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: true,
        showWarn: false,
        invalidText: "Required",
        requireInvalidText: true,
      }),
    ).toBe("error-x");
    expect(
      resolveStatusDescribedBy({
        ...base,
        showInvalid: false,
        showWarn: true,
        warnText: "Careful",
        requireWarnText: true,
      }),
    ).toBe("warn-x");
  });
});
