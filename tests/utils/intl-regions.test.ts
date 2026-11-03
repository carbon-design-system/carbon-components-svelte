// @vitest-environment node
import { createRegionSource } from "../../src/utils/intl-regions.js";
import { matchesTokens, parseQuery } from "../../src/utils/intl-search.js";

describe("createRegionSource", () => {
  const source = createRegionSource({ locale: "en" });

  it("sorts by the name in the UI locale", () => {
    expect(source.items.length).toBeGreaterThan(240);
    const names = source.items.map((item) => item.text);
    expect(names).toEqual([...names].sort(new Intl.Collator("en").compare));
    const ar = createRegionSource({ locale: "ar" });
    expect(ar.items.map((item) => item.text)).toEqual(
      [...ar.items.map((item) => item.text)].sort(
        new Intl.Collator("ar").compare,
      ),
    );
  });

  it("searches the name, the code and the name in the region's own language", () => {
    source.ensure();
    const find = (query: string) =>
      source.items
        .filter((item) => matchesTokens(item.search, parseQuery(query)))
        .map((item) => item.id);

    expect(find("switz")).toEqual(["CH"]);
    expect(find("schweiz")).toEqual(["CH"]);
    expect(find("日本")).toEqual(["JP"]);
    expect(find("ch")).toContain("CH");
    expect(find("cote")).toEqual(["CI"]);
  });

  it("searches a region's English name from another locale", () => {
    const de = createRegionSource({ locale: "de" });
    de.ensure();

    expect(
      de.items
        .filter((item) => matchesTokens(item.search, parseQuery("germany")))
        .map((item) => item.id),
    ).toEqual(["DE"]);
  });

  it("describes a region, with no native name where it is the UI language", () => {
    expect(source.detail("CH")).toEqual({
      value: "CH",
      name: "Switzerland",
      nativeName: "Schweiz",
    });
    expect(source.detail("US").nativeName).toBe("");
    expect(createRegionSource({ locale: "de" }).detail("CH").nativeName).toBe(
      "",
    );
  });

  it("takes a caller's list in its order, group codes too", () => {
    const own = createRegionSource({
      locale: "en",
      values: ["150", "US", "019"],
    });

    expect(own.items.map((item) => item.text)).toEqual([
      "Europe",
      "United States",
      "Americas",
    ]);
  });

  it("detects the region of the locale, if it is listed", () => {
    expect(source.detect()).toBe("US");
    expect(createRegionSource({ locale: "de" }).detect()).toBe("DE");
    expect(createRegionSource({ locale: "en", values: ["FR"] }).detect()).toBe(
      "",
    );
  });

  it("resolves a lower-case code", () => {
    expect(source.resolve("ch")).toBe("CH");
    expect(source.resolve("zz")).toBe("zz");
  });
});
