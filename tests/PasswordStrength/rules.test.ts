import {
  checkRequirements,
  defaultRequirements,
  passwordRules,
} from "carbon-components-svelte/PasswordStrength/rules.js";

const { minLength, hasNumber, hasSymbol, noSpaces, notCommon, matches } =
  passwordRules;

describe("password rules", () => {
  it("counts code points, not UTF-16 units, toward the minimum length", () => {
    const rule = minLength(4);
    expect(rule.test("😀😀😀", {} as never)).toBe(false);
    expect(rule.test("😀😀😀😀", {} as never)).toBe(true);
  });

  it("checks for a number, a symbol and no spaces", () => {
    const ctx = {} as never;
    expect(hasNumber().test("abc1", ctx)).toBe(true);
    expect(hasNumber().test("abc", ctx)).toBe(false);
    expect(hasSymbol().test("abc!", ctx)).toBe(true);
    expect(hasSymbol().test("abc 1", ctx)).toBe(false);
    expect(noSpaces().test("a b", ctx)).toBe(false);
    expect(noSpaces().test("a\tb", ctx)).toBe(false);
    expect(noSpaces().test("a-b", ctx)).toBe(true);
  });

  it("builds the confirm rule from the other password", () => {
    const rule = matches("hunter22");
    expect(rule.test("hunter22", {} as never)).toBe(true);
    expect(rule.test("hunter2", {} as never)).toBe(false);
    expect(matches("").test("", {} as never)).toBe(false);
  });
});

describe("checkRequirements", () => {
  it("defaults to length, a blocklist and the user's own words, with no composition rules", () => {
    expect(defaultRequirements().map((r) => r.id)).toEqual([
      "length",
      "common",
      "user-input",
    ]);
  });

  it("leaves out the user-input rule until there is something to compare with", () => {
    const withoutInputs = checkRequirements(
      "x".repeat(12),
      defaultRequirements(),
    );
    expect(withoutInputs.results.map((r) => r.id)).toEqual([
      "length",
      "common",
    ]);

    const withInputs = checkRequirements(
      "x".repeat(12),
      defaultRequirements(),
      {
        userInputs: ["alice@example.com"],
      },
    );
    expect(withInputs.results.map((r) => r.id)).toContain("user-input");
  });

  it("lists the unmet requirements and is valid only when none is unmet", () => {
    const requirements = [minLength(12), hasNumber(), hasSymbol(), noSpaces()];
    const weak = checkRequirements("short pass", requirements);
    expect(weak.valid).toBe(false);
    expect(weak.unmet.map((r) => r.id)).toEqual([
      "length",
      "number",
      "symbol",
      "spaces",
    ]);

    const ok = checkRequirements("a-long-pass-12", requirements);
    expect(ok.valid).toBe(true);
    expect(ok.unmet).toEqual([]);
  });

  it("rejects a password that contains the email or name", () => {
    const options = { userInputs: ["Alice Smith", "alice@example.com"] };
    const result = checkRequirements(
      "my-alice-pw-2024!",
      defaultRequirements(),
      options,
    );
    expect(result.unmet.map((r) => r.id)).toEqual(["user-input"]);
    expect(
      checkRequirements("t4Hq-9zWc.Lm2-Xv8Bn", defaultRequirements(), options)
        .valid,
    ).toBe(true);
  });

  it("rejects common passwords, with or without a trailing digit", () => {
    const requirements = [notCommon()];
    expect(checkRequirements("princess", requirements).valid).toBe(false);
    expect(checkRequirements("Princess12", requirements).valid).toBe(false);
    expect(checkRequirements("lavender-sofa-tuesday", requirements).valid).toBe(
      true,
    );
  });

  it("meets nothing while the password is empty, even the negative rules", () => {
    const result = checkRequirements("", defaultRequirements());
    expect(result.valid).toBe(false);
    expect(result.results.every((r) => !r.met)).toBe(true);
  });

  it("takes a rule written by the app", () => {
    const rule = {
      id: "no-x",
      text: "No x",
      test: (pw: string) => !pw.includes("x"),
    };
    expect(checkRequirements("xyz", [rule]).unmet[0]).toEqual({
      id: "no-x",
      text: "No x",
      met: false,
    });
  });
});
