// @vitest-environment node
// @depends-on src/**

// A prop typed as a union of string literals lists each value once. The
// docs render the values as a keyed list, so a repeated value crashes the
// component's docs page.
const sources = import.meta.glob<string>("../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const LITERAL_UNION =
  /@type \{((?:\s*"[^"]+"\s*\|)+\s*(?:"[^"]+"|undefined)\s*)\}/g;

describe("prop literal unions", () => {
  it("list each value once", () => {
    const duplicates = Object.entries(sources).flatMap(([path, source]) =>
      [...source.matchAll(LITERAL_UNION)].flatMap(([, union]) => {
        const values = [...union.matchAll(/"([^"]+)"/g)].map(([, v]) => v);
        return values
          .filter((value, i) => values.indexOf(value) !== i)
          .map((value) => `${path}: ${value}`);
      }),
    );
    expect(duplicates).toEqual([]);
  });
});
