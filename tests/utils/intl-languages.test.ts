// @vitest-environment node
import { createLanguageSource } from "../../src/utils/intl-languages.js";
import { matchesTokens, parseQuery } from "../../src/utils/intl-search.js";

describe("createLanguageSource", () => {
  const source = createLanguageSource({ locale: "en" });

  it("names each language in the UI locale and in itself", () => {
    expect(source.detail("fr")).toEqual({
      value: "fr",
      name: "French",
      endonym: "français",
      dir: "ltr",
    });
    expect(source.detail("ar")).toMatchObject({
      endonym: "العربية",
      dir: "rtl",
    });
    expect(source.detail("he")).toMatchObject({ dir: "rtl" });
  });

  it("has no endonym where it is the UI name", () => {
    expect(source.detail("en").endonym).toBe("");
  });

  it("adds variants next to their language, named so they sort there", () => {
    const withVariants = createLanguageSource({ locale: "en", variants: true });
    const names = withVariants.items.map((item) => item.text);

    const at = names.indexOf("Portuguese");
    expect(names.slice(at, at + 3)).toEqual([
      "Portuguese",
      "Portuguese (Brazil)",
      "Portuguese (Portugal)",
    ]);
    const dialect = createLanguageSource({
      locale: "en",
      variants: true,
      languageDisplay: "dialect",
    });
    expect(dialect.items.find((item) => item.id === "pt-BR")?.text).toBe(
      "Brazilian Portuguese",
    );
  });

  it("searches the name, the tag and the endonym", () => {
    source.ensure();
    const find = (query: string) =>
      source.items
        .filter((item) => matchesTokens(item.search, parseQuery(query)))
        .map((item) => item.id);

    expect(find("french")).toEqual(["fr"]);
    expect(find("fran")).toEqual(["fr"]);
    expect(find("日本語")).toEqual(["ja"]);
    expect(find("deutsch")).toEqual(["de"]);
  });

  it("resolves a deprecated tag to its successor", () => {
    expect(source.resolve("iw")).toBe("he");
    expect(source.resolve("fr")).toBe("fr");
    expect(source.resolve("!!")).toBe("!!");
  });

  it("detects the browser's language", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: { languages: ["pt-BR", "en"], language: "pt-BR" },
      configurable: true,
    });
    try {
      expect(source.detect()).toBe("pt");
    } finally {
      if (original) Object.defineProperty(globalThis, "navigator", original);
      else Reflect.deleteProperty(globalThis, "navigator");
    }
  });
});
