import {
  DEFAULT_STATE,
  formatCatalogUrl,
  MAX_PAGES,
  parseCatalogUrl,
  sameQuery,
} from "../../docs/src/catalog-page/catalog-url.js";

describe("catalog URL state", () => {
  it("round-trips every part of the state", () => {
    const state = {
      q: "vault open",
      filters: { category: ["Compute", "Security"], verified: true },
      sort: "newest",
      view: "list" as const,
      pages: 4,
    };
    const search = formatCatalogUrl(state);

    expect(search).toBe(
      "?q=vault+open&category=Compute&category=Security&verified=true&sort=newest&view=list&page=4",
    );
    expect(parseCatalogUrl(search)).toEqual(state);
  });

  it("writes nothing for the default state", () => {
    expect(formatCatalogUrl(DEFAULT_STATE)).toBe("");
    expect(parseCatalogUrl("")).toEqual(DEFAULT_STATE);
  });

  it("drops what it does not understand", () => {
    expect(
      parseCatalogUrl(
        "?sort=popular&view=cards&page=-3&category=Nope&category=Compute&unknown=1",
      ),
    ).toEqual({ ...DEFAULT_STATE, filters: { category: ["Compute"] } });
    expect(parseCatalogUrl("?page=99999").pages).toBe(MAX_PAGES);
    expect(parseCatalogUrl("?page=abc").pages).toBe(1);
  });

  it("leaves a parameter it does not own where it was", () => {
    const next = formatCatalogUrl(
      { ...DEFAULT_STATE, q: "vault" },
      "?theme=g100&q=old&page=3",
    );

    expect(new URLSearchParams(next).get("theme")).toBe("g100");
    expect(new URLSearchParams(next).get("q")).toBe("vault");
    expect(new URLSearchParams(next).has("page")).toBe(false);
  });

  it("treats a deeper load or another view as the same query", () => {
    const a = parseCatalogUrl("?q=vault&category=Compute");
    expect(sameQuery(a, { ...a, pages: 5, view: "list" })).toBe(true);
    expect(sameQuery(a, { ...a, sort: "name" })).toBe(false);
    expect(sameQuery(a, { ...a, filters: {} })).toBe(false);
  });
});
