import {
  appliedFilters,
  compactTreeIds,
  countFilters,
  deriveFacetOptions,
  expandTreeIds,
  type Facet,
  facetCounts,
  filterRecords,
  type FilterState,
  fromConditions,
  fromFilters,
  fromQuery,
  fromSearchParams,
  matchesConditions,
  normalizeFilterState,
  removeApplied,
  toConditions,
  toFilters,
  toQuery,
  toSearchParams,
  type TreeFacet,
} from "carbon-components-svelte/FilterPanel/filter-model.js";

type Phone = {
  brand: string;
  color: string;
  tags: string[];
  price: number;
  stock: boolean;
  added: string;
  category: string;
};

const records: Phone[] = [
  {
    brand: "Acme",
    color: "red",
    tags: ["new", "sale"],
    price: 10,
    stock: true,
    added: "2026-01-05",
    category: "phones",
  },
  {
    brand: "Acme",
    color: "blue",
    tags: ["new"],
    price: 20,
    stock: false,
    added: "2026-02-10",
    category: "laptops",
  },
  {
    brand: "Bolt",
    color: "red",
    tags: ["sale"],
    price: 30,
    stock: true,
    added: "2026-03-15",
    category: "phones",
  },
  {
    brand: "Bolt",
    color: "green",
    tags: ["new", "sale"],
    price: 40,
    stock: true,
    added: "2026-04-20",
    category: "tablets",
  },
  {
    brand: "Core",
    color: "blue",
    tags: [],
    price: 50,
    stock: false,
    added: "2026-05-25",
    category: "cases",
  },
];

const tree: TreeFacet = {
  id: "category",
  label: "Category",
  type: "tree",
  options: [
    {
      id: "devices",
      label: "Devices",
      children: [
        {
          id: "mobile",
          label: "Mobile",
          children: [{ id: "phones" }, { id: "tablets" }],
        },
        { id: "laptops" },
      ],
    },
    { id: "cases" },
  ],
};

const facets: Facet[] = [
  { id: "brand", label: "Brand", type: "checkbox" },
  {
    id: "color",
    label: "Color",
    type: "radio",
    options: [{ id: "red" }, { id: "blue" }, { id: "green" }],
  },
  { id: "tags", label: "Tags", type: "checkbox", match: "all" },
  { id: "price", label: "Price", type: "range", min: 0, max: 100 },
  {
    id: "stock",
    label: "In stock",
    type: "toggle",
    toggleLabel: "In stock only",
  },
  { id: "added", label: "Added", type: "date" },
  tree,
];

describe("facetCounts", () => {
  it("counts every option when nothing is applied", () => {
    const { total, counts } = facetCounts(records, facets, {});
    expect(total).toBe(5);
    expect(counts.brand).toEqual({ Acme: 2, Bolt: 2, Core: 1 });
    expect(counts.color).toEqual({ red: 2, blue: 2, green: 1 });
    expect(counts.stock).toEqual({ true: 3 });
  });

  it("does not shrink a facet's counts by its own selection", () => {
    const { total, counts } = facetCounts(records, facets, {
      brand: ["Acme"],
      color: "red",
    });
    expect(total).toBe(1);
    // brand: filtered by color alone, so Bolt still shows its red phone.
    expect(counts.brand).toEqual({ Acme: 1, Bolt: 1 });
    // color: filtered by brand alone.
    expect(counts.color).toEqual({ red: 1, blue: 1 });
    // every other facet sees both selections.
    expect(counts.tags).toEqual({ new: 1, sale: 1 });
  });

  it("counts a match-all facet under its own selection", () => {
    const { counts } = facetCounts(records, facets, { tags: ["new", "sale"] });
    expect(counts.tags).toEqual({ new: 2, sale: 2 });
    const any = facetCounts(
      records,
      facets.map((f) =>
        f.id === "tags" ? { ...f, match: "any" as const } : f,
      ),
      { tags: ["new", "sale"] },
    );
    expect(any.counts.tags).toEqual({ new: 3, sale: 3 });
  });

  it("rolls a tree's counts up to its ancestors", () => {
    const { counts } = facetCounts(records, facets, {});
    expect(counts.category).toEqual({
      devices: 4,
      mobile: 3,
      phones: 2,
      tablets: 1,
      laptops: 1,
      cases: 1,
    });
  });

  it("matches filterRecords for every combination of three facets", () => {
    const picks: FilterState[] = [
      {},
      { brand: ["Acme"] },
      { brand: ["Acme", "Bolt"], color: "red" },
      { price: [15, null], stock: true },
      { added: ["2026-02-01", "2026-04-30"], tags: ["sale"] },
      { category: ["devices"], price: [null, 35] },
    ];
    for (const state of picks) {
      expect(facetCounts(records, facets, state).total).toBe(
        filterRecords(records, facets, state).length,
      );
    }
  });

  it("agrees with a brute force recount for each facet", () => {
    const state: FilterState = {
      brand: ["Bolt"],
      price: [null, 45],
      stock: true,
    };
    const { counts } = facetCounts(records, facets, state);
    for (const facet of facets) {
      if (facet.id !== "brand" && facet.id !== "color") continue;
      const others = { ...state };
      delete others[facet.id];
      const expected: Record<string, number> = {};
      for (const record of filterRecords(records, facets, others)) {
        const key = String((record as Record<string, unknown>)[facet.id]);
        expected[key] = (expected[key] ?? 0) + 1;
      }
      expect(counts[facet.id]).toEqual(expected);
    }
  });
});

describe("normalizeFilterState", () => {
  it("drops unknown facets and empty values, and orders a reversed range", () => {
    const state = normalizeFilterState(facets, {
      brand: [],
      nope: ["x"],
      price: [90, 10],
      added: ["not a date", null],
      stock: false,
      color: "",
    });
    expect(state).toEqual({ price: [10, 90] });
  });

  it("does not read inherited keys", () => {
    const state = normalizeFilterState(
      [{ id: "toString", label: "x", type: "toggle" }],
      {},
    );
    expect(state).toEqual({});
  });

  it("counts one per checked option", () => {
    expect(countFilters(facets, { brand: ["Acme", "Bolt"], stock: true })).toBe(
      3,
    );
  });
});

describe("tree selection", () => {
  it("expands to descendants and compacts back to the topmost nodes", () => {
    expect(expandTreeIds(tree, ["mobile"]).sort()).toEqual([
      "mobile",
      "phones",
      "tablets",
    ]);
    expect(compactTreeIds(tree, ["mobile", "phones", "tablets"])).toEqual([
      "mobile",
    ]);
    expect(compactTreeIds(tree, ["phones"])).toEqual(["phones"]);
    // A parent with one child unchecked is not a selection on its own.
    expect(compactTreeIds(tree, ["devices", "mobile", "phones"])).toEqual([
      "phones",
    ]);
  });
});

describe("conversions", () => {
  const state: FilterState = {
    brand: ["Acme", "Bolt"],
    tags: ["new", "sale"],
    price: [15, null],
    added: ["2026-01-01", "2026-04-30"],
    stock: true,
    category: ["mobile"],
  };

  it("writes the TokenSearch filter list", () => {
    expect(toFilters(facets, state)).toEqual([
      { key: "brand", op: "eq", values: ["Acme", "Bolt"], negated: false },
      { key: "tags", op: "eq", values: ["new"], negated: false },
      { key: "tags", op: "eq", values: ["sale"], negated: false },
      { key: "price", op: "gte", values: ["15"], negated: false },
      { key: "stock", op: "eq", values: ["true"], negated: false },
      {
        key: "added",
        op: "between",
        values: ["2026-01-01", "2026-04-30"],
        negated: false,
      },
      {
        key: "category",
        op: "eq",
        values: ["phones", "tablets"],
        negated: false,
      },
    ]);
  });

  it("round trips the state through the filter list", () => {
    const { state: back, skipped } = fromFilters(
      facets,
      toFilters(facets, state),
    );
    expect(skipped).toEqual([]);
    expect(back).toEqual(normalizeFilterState(facets, state));
  });

  it("reads a TokenSearch query, free text beside it", () => {
    const read = fromQuery(facets, {
      text: "case",
      filters: [
        { key: "price", op: "between", values: ["10", "20"] },
        { key: "brand", op: "eq", values: ["Acme"], negated: true },
        { key: "weight", op: "gt", values: ["3"] },
      ],
    });
    expect(read.text).toBe("case");
    expect(read.state).toEqual({ price: [10, 20] });
    expect(read.skipped.map((f) => f.key)).toEqual(["brand", "weight"]);
    expect(toQuery(facets, read.state, "case")).toEqual({
      text: "case",
      filters: [
        { key: "price", op: "between", values: ["10", "20"], negated: false },
      ],
    });
  });

  it("writes a QueryBuilder tree that selects the same records", () => {
    const tree = toConditions(facets, state);
    expect(tree.operator).toBe("and");
    expect(tree.conditions).toContainEqual({
      field: "brand",
      operator: "isAnyOf",
      value: ["Acme", "Bolt"],
    });
    expect(tree.conditions).toContainEqual({
      field: "stock",
      operator: "is",
      value: true,
    });
    expect(tree.conditions).toContainEqual({
      field: "price",
      operator: "gte",
      value: 15,
    });
    for (const picked of [
      state,
      { brand: ["Bolt"] },
      { price: [null, 35], stock: true },
      { category: ["devices"] },
    ]) {
      const group = toConditions(facets, picked);
      expect(
        records.filter((r) => matchesConditions(facets, group, r)),
      ).toEqual(filterRecords(records, facets, picked));
    }
  });

  it("reads a QueryBuilder tree back, and reports what it cannot show", () => {
    const read = fromConditions(facets, toConditions(facets, state));
    expect(read.skipped).toEqual([]);
    expect(read.state).toEqual(normalizeFilterState(facets, state));

    const odd = fromConditions(facets, {
      operator: "and",
      conditions: [
        { field: "brand", operator: "isNoneOf", value: ["Acme"] },
        { field: "price", operator: "gte", value: 5 },
        {
          operator: "or",
          conditions: [{ field: "stock", operator: "is", value: true }],
        },
        { field: "nope", operator: "is", value: "x" },
      ],
    });
    expect(odd.state).toEqual({ price: [5, null] });
    expect(odd.skipped).toHaveLength(3);

    const or = fromConditions(facets, {
      operator: "or",
      conditions: [{ field: "brand", operator: "is", value: "Acme" }],
    });
    expect(or.state).toEqual({});
    expect(or.skipped).toHaveLength(1);
  });
});

describe("URL parameters", () => {
  const state: FilterState = {
    brand: ["Acme", "Bolt, Inc"],
    color: "red",
    price: [null, 50],
    added: ["2026-01-01", null],
    stock: true,
    category: ["mobile"],
  };
  const withOptions: Facet[] = facets.map((f) =>
    f.id === "brand"
      ? { ...f, options: [{ id: "Acme" }, { id: "Bolt, Inc" }] }
      : f,
  );

  it("writes one parameter per value, so a comma stays in its value", () => {
    const params = toSearchParams(withOptions, state);
    expect(params.toString()).toBe(
      "brand=Acme&brand=Bolt%2C+Inc&color=red&price=..50&stock=true&added=2026-01-01..&category=mobile",
    );
  });

  it("round trips, with a prefix too", () => {
    expect(
      fromSearchParams(withOptions, toSearchParams(withOptions, state)),
    ).toEqual(state);
    const prefixed = toSearchParams(withOptions, state, { prefix: "f." });
    expect(prefixed.has("f.brand")).toBe(true);
    expect(fromSearchParams(withOptions, prefixed, { prefix: "f." })).toEqual(
      state,
    );
  });

  it("reads only the schema, and drops what does not parse or is not an option", () => {
    const read = fromSearchParams(
      withOptions,
      "brand=Acme&brand=Evil&color=purple&price=abc..9&added=2026-13-99..&stock=yes&__proto__=x&page=2&category=nope&unknown=1",
    );
    expect(read).toEqual({ brand: ["Acme"], price: [null, 9] });
    expect(Object.getPrototypeOf(read)).toBe(Object.prototype);
  });

  it("keeps values a facet without options cannot judge", () => {
    expect(fromSearchParams(facets, "brand=Anything")).toEqual({
      brand: ["Anything"],
    });
  });
});

describe("summary chips", () => {
  const state: FilterState = {
    brand: ["Acme", "Bolt"],
    price: [10, 20],
    stock: true,
    category: ["mobile"],
  };

  it("makes one chip per selection", () => {
    expect(appliedFilters(facets, state).map((c) => c.label)).toEqual([
      "Brand: Acme",
      "Brand: Bolt",
      "Price: 10 to 20",
      "In stock only",
      "Category: Mobile",
    ]);
  });

  it("removes one selection, and a facet once its last one goes", () => {
    const chips = appliedFilters(facets, state);
    const once = removeApplied(facets, state, chips[0]);
    expect(once.brand).toEqual(["Bolt"]);
    const twice = removeApplied(facets, once, chips[1]);
    expect(twice).not.toHaveProperty("brand");
    expect(removeApplied(facets, state, chips[2])).not.toHaveProperty("price");
  });
});

describe("deriveFacetOptions", () => {
  it("reads options from the records, most common first", () => {
    const [brand] = deriveFacetOptions(records, [facets[0]]);
    expect("options" in brand && brand.options?.map((o) => o.id)).toEqual([
      "Acme",
      "Bolt",
      "Core",
    ]);
    const [tags] = deriveFacetOptions(records, [facets[2]]);
    expect("options" in tags && tags.options?.map((o) => o.id)).toEqual([
      "new",
      "sale",
    ]);
  });
});
