import { resolveLinkRel } from "../../src/utils/link-rel.js";

describe("resolveLinkRel", () => {
  test("defaults to noopener noreferrer for a new tab", () => {
    expect(resolveLinkRel("_blank")).toBe("noopener noreferrer");
  });

  test("returns undefined for other targets", () => {
    expect(resolveLinkRel("_self")).toBeUndefined();
    expect(resolveLinkRel(undefined)).toBeUndefined();
    expect(resolveLinkRel(null)).toBeUndefined();
  });

  test("an explicit rel wins, including an empty string", () => {
    expect(resolveLinkRel("_blank", "external")).toBe("external");
    expect(resolveLinkRel("_blank", "")).toBe("");
    expect(resolveLinkRel(undefined, "nofollow")).toBe("nofollow");
  });
});
