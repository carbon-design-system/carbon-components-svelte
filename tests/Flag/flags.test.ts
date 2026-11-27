import { flags, getFlag } from "carbon-components-svelte/flags/all";
import { JP } from "carbon-components-svelte/flags/index.js";

describe("getFlag", () => {
  it("finds a flag by its code in any case", () => {
    expect(getFlag("JP")).toBe(JP);
    expect(getFlag("jp")).toBe(JP);
  });

  it("finds nothing for a region with no flag, or a name that is not a code", () => {
    for (const code of ["XK", "", "constructor", "__proto__", "toString"]) {
      expect(getFlag(code), code).toBeUndefined();
    }
  });

  it("lists every flag under its own code", () => {
    expect(Object.keys(flags).length).toBeGreaterThan(90);
    for (const [code, flag] of Object.entries(flags)) {
      expect(flag.code).toBe(code);
    }
  });
});
