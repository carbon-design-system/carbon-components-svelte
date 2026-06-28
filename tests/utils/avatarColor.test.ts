import {
  AVATAR_BACKGROUND_COLORS,
  getAvatarBackgroundColor,
  hashString,
} from "../../src/utils/avatarColor.js";

describe("hashString", () => {
  test("is deterministic for the same input", () => {
    expect(hashString("Richard Hendricks")).toBe(
      hashString("Richard Hendricks"),
    );
  });

  test("returns a non-negative integer", () => {
    for (const value of ["", "a", "Jane Roe", "🚀"]) {
      const hash = hashString(value);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
    }
  });

  test("differs for different inputs", () => {
    expect(hashString("Monica")).not.toBe(hashString("Richard"));
  });
});

describe("getAvatarBackgroundColor", () => {
  test("maps the same input to the same color", () => {
    expect(getAvatarBackgroundColor("Jane Roe")).toBe(
      getAvatarBackgroundColor("Jane Roe"),
    );
  });

  test("returns a color from the default palette", () => {
    expect(AVATAR_BACKGROUND_COLORS).toContain(
      getAvatarBackgroundColor("Richard Hendricks"),
    );
  });

  test("distributes varied inputs across more than one color", () => {
    const names = [
      "Monica",
      "Richard",
      "Dinesh",
      "Gilfoyle",
      "Jared",
      "Erlich",
    ];
    const colors = new Set(names.map((name) => getAvatarBackgroundColor(name)));
    expect(colors.size).toBeGreaterThan(1);
  });

  test("returns the first palette entry for empty or nullish input", () => {
    expect(getAvatarBackgroundColor("")).toBe(AVATAR_BACKGROUND_COLORS[0]);
    expect(getAvatarBackgroundColor(null)).toBe(AVATAR_BACKGROUND_COLORS[0]);
    expect(getAvatarBackgroundColor(undefined)).toBe(
      AVATAR_BACKGROUND_COLORS[0],
    );
  });

  test("supports a custom palette", () => {
    const palette = ["one", "two"] as const;
    const color = getAvatarBackgroundColor("anything", palette);
    expect(palette).toContain(color);
  });
});
