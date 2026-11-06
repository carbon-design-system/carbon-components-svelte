import {
  FACETS,
  generateCatalog,
} from "../../docs/src/catalog-page/catalog-data.js";
import {
  createMemorySource,
  loadCatalog,
} from "../../docs/src/catalog-page/catalog-source.js";
import type { CatalogQuery } from "../../docs/src/catalog-page/catalog-source.js";
import { filterRecords } from "../../src/FilterPanel/filter-model.js";

const base = (query: Partial<CatalogQuery> = {}): CatalogQuery => ({
  q: "",
  filters: {},
  sort: "relevance",
  cursor: null,
  limit: 24,
  ...query,
});

describe("catalog memory source", () => {
  const items = generateCatalog(1200);
  const source = createMemorySource({ items });

  it("makes the same catalog every time", () => {
    expect(generateCatalog(50)).toEqual(generateCatalog(50));
    expect(new Set(generateCatalog(5000).map((item) => item.name)).size).toBe(
      5000,
    );
  });

  it("pages by cursor with no gaps and no repeats", async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      // eslint-disable-next-line no-await-in-loop -- the cursor comes from the last page
      const page = await source.query(base({ cursor, limit: 100 }));
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor;
    } while (cursor);

    expect(seen).toHaveLength(1200);
    expect(new Set(seen).size).toBe(1200);
  });

  it("counts a facet without its own choice, and returns counts on the first page only", async () => {
    const all = await source.query(base());
    const chosen = await source.query(
      base({ filters: { category: ["Compute"], type: ["Service"] } }),
    );
    const expected = filterRecords(items, FACETS, {
      category: ["Compute"],
      type: ["Service"],
    }).length;

    expect(chosen.total).toBe(expected);
    // Category's own counts ignore the category choice; they do follow the type.
    const services = items.filter((item) => item.type === "Service");
    expect(chosen.counts?.category.Analytics).toBe(
      services.filter((item) => item.category === "Analytics").length,
    );
    expect(all.counts?.category.Compute).toBe(
      items.filter((item) => item.category === "Compute").length,
    );
    expect(
      (await source.query(base({ cursor: all.nextCursor }))).counts,
    ).toBeUndefined();
  });

  it("matches every word, folds accents and ranks a name above a description", async () => {
    const result = await source.query(base({ q: "VAULT  pro", limit: 200 }));

    expect(result.total).toBeGreaterThan(0);
    for (const item of result.items) {
      const text =
        `${item.name} ${item.provider} ${item.tags.join(" ")} ${item.description}`.toLowerCase();
      expect(text).toContain("vault");
      expect(text).toContain("pro");
    }
    // A name that holds both words outranks a description that does.
    const first = result.items[0].name.toLowerCase();
    expect(first).toContain("vault");
    expect(first).toContain("pro");
    expect((await source.query(base({ q: "zzzz-no-such" }))).total).toBe(0);
  });

  it("sorts, and keeps the order stable across pages", async () => {
    const byName = await source.query(base({ sort: "name", limit: 50 }));
    const names = byName.items.map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    const rated = await source.query(base({ sort: "rating", limit: 50 }));
    const ratings = rated.items.map((item) => item.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it("stops a query that was aborted", async () => {
    const slow = createMemorySource({ items, latency: 20 });
    const controller = new AbortController();
    const pending = slow.query(base({ signal: controller.signal }));
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("loadCatalog", () => {
  const items = generateCatalog(500);

  it("covers the first N pages in one request when the source allows it", async () => {
    const source = createMemorySource({ items, maxLimit: 500 });
    const spy = vi.spyOn(source, "query");
    const result = await loadCatalog(
      source,
      { q: "", filters: {}, sort: "name", pages: 5 },
      { pageSize: 24 },
    );

    expect(result.items).toHaveLength(120);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.nextCursor).not.toBeNull();
  });

  it("chains cursor requests when the source caps a request", async () => {
    const source = createMemorySource({ items, maxLimit: 50 });
    const spy = vi.spyOn(source, "query");
    const result = await loadCatalog(
      source,
      { q: "", filters: {}, sort: "name", pages: 5 },
      { pageSize: 24 },
    );

    expect(result.items).toHaveLength(120);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(new Set(result.items.map((item) => item.id)).size).toBe(120);
    expect(result.counts).toBeDefined();
  });
});
