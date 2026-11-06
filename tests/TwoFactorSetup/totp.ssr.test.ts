// @vitest-environment node
// Runs in the node project: `crypto.subtle` is Node's, not jsdom's.
// The example keeps its TOTP in the module script, so the test loads it like
// any module. A `.svelte` import has no named exports in the type checker.
interface Totp {
  base32Decode: (text: string) => Uint8Array;
  base32Encode: (bytes: Uint8Array) => string;
  checkTotp: (
    key: Uint8Array,
    code: string,
    time?: number,
  ) => Promise<"ok" | "expired" | "wrong">;
  hotp: (key: Uint8Array, counter: number, digits?: number) => Promise<string>;
  recoveryCodes: (count?: number) => string[];
  totp: (key: Uint8Array, time?: number, digits?: number) => Promise<string>;
}
const { base32Decode, base32Encode, checkTotp, hotp, recoveryCodes, totp } =
  (await import("../../docs/src/pages/framed/TwoFactorSetup/TwoFactorSetup.svelte")) as unknown as Totp;

const ascii = (text: string) => new TextEncoder().encode(text);
// The key every RFC 4226 and RFC 6238 test vector uses.
const KEY = ascii("12345678901234567890");

describe("base32", () => {
  // RFC 4648 section 10, without padding, as otpauth URIs write it.
  it.each([
    ["", ""],
    ["f", "MY"],
    ["fo", "MZXQ"],
    ["foo", "MZXW6"],
    ["foob", "MZXW6YQ"],
    ["fooba", "MZXW6YTB"],
    ["foobar", "MZXW6YTBOI"],
  ])("encodes %j as %s", (text, encoded) => {
    expect(base32Encode(ascii(text))).toBe(encoded);
    expect(new TextDecoder().decode(base32Decode(encoded))).toBe(text);
  });

  it("decodes a key written in groups, in lower case", () => {
    expect(new TextDecoder().decode(base32Decode("mzxw 6ytb oi"))).toBe(
      "foobar",
    );
  });

  it("rejects characters outside the alphabet", () => {
    expect(() => base32Decode("MZXW1")).toThrow("Not a base32 character");
  });
});

describe("hotp and totp", () => {
  // RFC 4226 appendix D.
  it.each([
    [0, "755224"],
    [1, "287082"],
    [2, "359152"],
    [3, "969429"],
    [4, "338314"],
    [5, "254676"],
    [6, "287922"],
    [7, "162583"],
    [8, "399871"],
    [9, "520489"],
  ])("HOTP counter %i is %s", async (counter, code) => {
    expect(await hotp(KEY, counter)).toBe(code);
  });

  // RFC 6238 appendix B, SHA-1 column: eight digits, 30-second steps.
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ])("TOTP at %i s is %s", async (seconds, code) => {
    expect(await totp(KEY, seconds * 1000, 8)).toBe(code);
  });
});

describe("checkTotp", () => {
  const now = 1_700_000_000_000;
  const at = (steps: number) => totp(KEY, now + steps * 30_000);

  it.each([-1, 0, 1])("accepts the step at offset %i", async (step) => {
    expect(await checkTotp(KEY, await at(step), now)).toBe("ok");
  });

  it.each([-2, -3, -5])("calls the code from step %i expired", async (step) => {
    expect(await checkTotp(KEY, await at(step), now)).toBe("expired");
  });

  it.each([["000000"], ["far past"]])("calls %s wrong", async (which) => {
    const code = which === "far past" ? await at(-9) : which;

    expect(await checkTotp(KEY, code, now)).toBe("wrong");
  });
});

describe("recoveryCodes", () => {
  it("makes ten distinct codes without look-alike characters", () => {
    const codes = recoveryCodes();

    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[a-hj-km-np-z2-9]{5}-[a-hj-km-np-z2-9]{5}$/);
    }
  });
});

export {};
