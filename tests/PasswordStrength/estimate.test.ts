import {
  createBlocklist,
  decodeBlocklist,
  encodeTier,
} from "carbon-components-svelte/PasswordStrength/blocklist.js";
import { commonPasswords10k } from "carbon-components-svelte/PasswordStrength/common-passwords-10k.js";
import {
  estimatePasswordStrength,
  isCommonPassword,
  MAX_ESTIMATE_LENGTH,
  userInputTokens,
} from "carbon-components-svelte/PasswordStrength/estimate.js";

const estimate = estimatePasswordStrength;

describe("estimatePasswordStrength", () => {
  it("rates an empty password as empty, with a score of 0", () => {
    const result = estimate("");
    expect(result.level).toBe("empty");
    expect(result.score).toBe(0);
    expect(result.patterns).toEqual([]);
  });

  it.each([
    "password",
    "123456",
    "letmein",
    "qwerty",
    "Password1!",
    "p4ssw0rd",
    "hunter2",
    "Summer2024!",
  ])("rates the common password %s as weak", (password) => {
    expect(estimate(password).level).toBe("weak");
  });

  it.each([
    ["aaaaaaaaaaaa", "repeat"],
    ["abcdefgh", "sequence"],
    ["987654321", "sequence"],
    ["qwertyuiop", "keyboard"],
    ["01/02/1999", "date"],
    ["horsehorsehorse", "repeat"],
  ])("finds the pattern in %s and rates it weak", (password, pattern) => {
    const result = estimate(password);
    expect(result.level).toBe("weak");
    expect(result.patterns.map((p) => p.pattern)).toContain(pattern);
  });

  it.each([
    "xK9#mQ2$vL7!pR4&",
    "correct horse battery staple",
    "t4Hq-9zWc.Lm2-Xv8Bn",
  ])("rates %s as strong", (password) => {
    expect(estimate(password).level).toBe("strong");
  });

  it("rates a short random password lower than a long one", () => {
    expect(estimate("j8Kd2nQ9").score).toBeLessThan(
      estimate("j8Kd2nQ9vT5wZ3xB").score,
    );
  });

  it("counts a letter substitution as worth almost nothing", () => {
    const plain = estimate("password").bits;
    const leet = estimate("p@ssw0rd").bits;
    expect(leet - plain).toBeLessThan(4);
    expect(estimate("p@ssw0rd").level).toBe("weak");
  });

  it("does not count capitalizing the first letter as much", () => {
    expect(
      estimate("Dragon").bits - estimate("dragon").bits,
    ).toBeLessThanOrEqual(1);
  });

  it("penalizes the user's own name and email", () => {
    const userInputs = ["alice.smith@example.com"];
    const without = estimate("AliceSmith1990x");
    const withInputs = estimate("AliceSmith1990x", { userInputs });
    expect(withInputs.bits).toBeLessThan(without.bits);
    expect(withInputs.feedback.warning).toBe("personal");
    expect(withInputs.patterns.map((p) => p.pattern)).toContain("user");
  });

  it("gives feedback for a weak password and none for a strong one", () => {
    const weak = estimate("password");
    expect(weak.feedback.warning).toBe("top10");
    expect(weak.feedback.suggestions).toContain("addWords");
    expect(estimate("xK9#mQ2$vL7!pR4&").feedback).toEqual({
      warning: null,
      suggestions: [],
    });
  });

  it("never puts the password or a piece of it in the result", () => {
    const password = "Zebra-Quokka-8841!";
    const json = JSON.stringify(
      estimate(password, { userInputs: ["quokka@example.com"] }),
    );
    for (const piece of [
      "Zebra",
      "zebra",
      "Quokka",
      "quokka",
      "8841",
      password,
    ]) {
      expect(json).not.toContain(piece);
    }
  });

  it("turns bits into crack time buckets that grow with the guesses", () => {
    const weak = estimate("password").crackTimes.offlineSlow;
    const strong = estimate("xK9#mQ2$vL7!pR4&").crackTimes.offlineSlow;
    expect(weak.bucket).toBe("instantly");
    expect(strong.bucket).toBe("centuries");
    expect(estimate("hello wor1d").crackTimes.offlineFast.seconds).toBeLessThan(
      estimate("hello wor1d").crackTimes.offlineSlow.seconds,
    );
  });

  it("looks only at the first MAX_ESTIMATE_LENGTH characters", () => {
    const long = "xK9#mQ2$vL7!pR4&".repeat(40);
    const result = estimate(long);
    expect(result.length).toBe(long.length);
    expect(result.patterns.every((p) => p.end < MAX_ESTIMATE_LENGTH)).toBe(
      true,
    );
  });

  it("counts astral characters as one", () => {
    expect(estimate("😀😀😀😀").length).toBe(4);
  });

  it("accepts a custom blocklist as a plain list, most common first", () => {
    const options = { blocklist: ["hunter42x", "swordfish99"] };
    expect(estimate("swordfish99", options).level).toBe("weak");
    expect(estimate("swordfish99", options).patterns[0].pattern).toBe(
      "dictionary",
    );
  });
});

describe("isCommonPassword", () => {
  it("matches case-insensitively with a few trailing characters", () => {
    expect(isCommonPassword("PASSWORD")).toBe(true);
    expect(isCommonPassword("password123")).toBe(true);
    expect(isCommonPassword("password1!")).toBe(true);
  });

  it("matches common letter substitutions", () => {
    expect(isCommonPassword("p@ssw0rd")).toBe(true);
  });

  it("does not match an uncommon password", () => {
    expect(isCommonPassword("t4Hq-9zWc.Lm2-Xv8Bn")).toBe(false);
    expect(isCommonPassword("")).toBe(false);
  });
});

describe("userInputTokens", () => {
  it("splits an email into its local part and domain, without the top-level label", () => {
    expect(userInputTokens(["Alice.Smith@example.com"])).toEqual([
      "alice.smith@example.com",
      "alice.smith",
      "alice",
      "smith",
      "example",
    ]);
  });

  it("drops anything shorter than three characters", () => {
    expect(userInputTokens(["Al", "bo", "  "])).toEqual([]);
  });
});

describe("blocklist", () => {
  it("round-trips a front-coded tier", () => {
    const words = [
      "password",
      "pass",
      "passion",
      "passport",
      "zebra",
      "123456",
    ];
    const list = decodeBlocklist([{ upTo: 6, words: encodeTier(words) }]);
    for (const word of words) expect(list.rank(word)).toBeDefined();
    expect(list.rank("passwor")).toBeUndefined();
    expect(list.size).toBe(words.length);
  });

  it("ranks by tier, so the most common words are the cheapest to guess", () => {
    const list = decodeBlocklist([
      { upTo: 10, words: encodeTier(["alpha"]) },
      { upTo: 1000, words: encodeTier(["bravo"]) },
    ]);
    expect(list.rank("alpha")!).toBeLessThan(list.rank("bravo")!);
  });

  it("ranks a plain list by position", () => {
    const list = createBlocklist(["Aaa", "bbb", "AAA"]);
    expect(list.rank("aaa")).toBe(1);
    expect(list.rank("bbb")).toBe(2);
  });

  it("decodes the 10,000-word list", () => {
    const list = decodeBlocklist(commonPasswords10k);
    expect(list.size).toBe(10_000);
    expect(list.rank("password")).toBeLessThanOrEqual(10);
    expect(list.rank("letmein")).toBeLessThanOrEqual(100);
    expect(list.rank("zebra-quokka-8841")).toBeUndefined();
  });

  it("rates a word past the top 1,000 as weaker with the 10,000-word list", () => {
    const word = "hercules";
    const big = estimate(word, {
      blocklist: decodeBlocklist(commonPasswords10k),
    });
    expect(big.patterns[0].pattern).toBe("dictionary");
    expect(big.bits).toBeLessThan(estimate(word).bits);
  });
});
