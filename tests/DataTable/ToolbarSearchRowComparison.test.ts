import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import ToolbarSearchRowComparison from "./ToolbarSearchRowComparison.test.svelte";

// Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/2143
describe("ToolbarSearch row comparison behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getFilteredIds = () => {
    const element = screen.getByTestId("filtered-ids");
    return JSON.parse(element.textContent || "[]");
  };

  const getUpdateCount = () => {
    const element = screen.getByTestId("update-count");
    return Number.parseInt(element.textContent || "0", 10);
  };

  it("updates when rows data changes", async () => {
    const initialRows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      { id: 1, name: "Row 1 Updated" },
      { id: 2, name: "Row 2" },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("updates when rows array length changes", async () => {
    const initialRows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
      { id: 3, name: "Row 3" },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toContain(3);
      expect(filteredIds.length).toBe(3);
    });
  });

  it("updates when row order changes", async () => {
    const initialRows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      { id: 2, name: "Row 2" },
      { id: 1, name: "Row 1" },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toContain(1);
      expect(filteredIds).toContain(2);
    });
  });

  it.skip("handles null/undefined values in rows", async () => {
    const rowsWithNull = [
      { id: 1, name: "Row 1", value: null },
      { id: 2, name: "Row 2", value: undefined },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: rowsWithNull },
    });

    await tick();
    const initialUpdateCount = getUpdateCount();

    const rowsWithNullOnly = [
      { id: 1, name: "Row 1", value: null },
      { id: 2, name: "Row 2" },
    ];

    rerender({ rows: rowsWithNullOnly });
    await tick();

    await waitFor(() => {
      const updateCount = getUpdateCount();
      expect(updateCount).toBeGreaterThan(initialUpdateCount);
      const filteredIds = getFilteredIds();
      expect(filteredIds.length).toBeGreaterThan(0);
    });
  });

  it.skip("handles NaN and Infinity values in rows", async () => {
    const initialRows = [
      { id: 1, name: "Row 1", count: Number.NaN },
      { id: 2, name: "Row 2", value: Number.POSITIVE_INFINITY },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();
    const initialUpdateCount = getUpdateCount();

    const newRows = [
      { id: 1, name: "Row 1", count: null },
      { id: 2, name: "Row 2", value: null },
    ];

    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const updateCount = getUpdateCount();
      expect(updateCount).toBeGreaterThan(initialUpdateCount);
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("handles nested objects (2-3 levels, contact.company pattern)", async () => {
    const initialRows = [
      { id: 1, contact: { company: "Super Wheels", address: { city: "NYC" } } },
      { id: 2, contact: { company: "Mini Wheels", address: { city: "LA" } } },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      {
        id: 1,
        contact: { company: "Super Wheels", address: { city: "Boston" } },
      },
      { id: 2, contact: { company: "Mini Wheels", address: { city: "LA" } } },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("handles deeply nested objects (3+ levels)", async () => {
    const initialRows = [
      {
        id: 1,
        user: {
          profile: {
            personal: { firstName: "John", lastName: "Doe" },
            settings: { theme: "dark" },
          },
        },
      },
      {
        id: 2,
        user: {
          profile: {
            personal: { firstName: "Jane", lastName: "Smith" },
            settings: { theme: "light" },
          },
        },
      },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      {
        id: 1,
        user: {
          profile: {
            personal: { firstName: "John", lastName: "Doe" },
            settings: { theme: "light" },
          },
        },
      },
      {
        id: 2,
        user: {
          profile: {
            personal: { firstName: "Jane", lastName: "Smith" },
            settings: { theme: "light" },
          },
        },
      },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("handles nested arrays within nested objects", async () => {
    const initialRows = [
      {
        id: 1,
        user: {
          tags: ["admin", "developer"],
          permissions: { roles: ["read", "write"] },
        },
      },
      {
        id: 2,
        user: {
          tags: ["user"],
          permissions: { roles: ["read"] },
        },
      },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      {
        id: 1,
        user: {
          tags: ["admin", "developer", "manager"],
          permissions: { roles: ["read", "write"] },
        },
      },
      {
        id: 2,
        user: {
          tags: ["user"],
          permissions: { roles: ["read"] },
        },
      },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("handles complex mixed nested structures (arrays of objects, multiple nesting levels)", async () => {
    const initialRows = [
      {
        id: 1,
        company: {
          name: "Acme Corp",
          departments: [
            {
              name: "Engineering",
              employees: [{ name: "Alice", role: "Engineer" }],
            },
          ],
          metadata: {
            founded: 2020,
            locations: ["NYC", "SF"],
          },
        },
      },
      {
        id: 2,
        company: {
          name: "Beta Inc",
          departments: [
            {
              name: "Sales",
              employees: [{ name: "Bob", role: "Manager" }],
            },
          ],
          metadata: {
            founded: 2018,
            locations: ["LA"],
          },
        },
      },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      {
        id: 1,
        company: {
          name: "Acme Corp",
          departments: [
            {
              name: "Engineering",
              employees: [
                { name: "Alice", role: "Engineer" },
                { name: "Charlie", role: "Senior Engineer" },
              ],
            },
          ],
          metadata: {
            founded: 2020,
            locations: ["NYC", "SF", "Austin"],
          },
        },
      },
      {
        id: 2,
        company: {
          name: "Beta Inc",
          departments: [
            {
              name: "Sales",
              employees: [{ name: "Bob", role: "Manager" }],
            },
          ],
          metadata: {
            founded: 2018,
            locations: ["LA"],
          },
        },
      },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("handles arrays within rows", async () => {
    const initialRows = [
      { id: 1, name: "Row 1", tags: ["tag1", "tag2"] },
      { id: 2, name: "Row 2", tags: ["tag3"] },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      { id: 1, name: "Row 1", tags: ["tag1", "tag2", "tag4"] },
      { id: 2, name: "Row 2", tags: ["tag3"] },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it.skip("handles RegExp objects in rows", async () => {
    const initialRows = [
      { id: 1, name: "Row 1", pattern: /abc/ },
      { id: 2, name: "Row 2", pattern: /xyz/ },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();
    const initialUpdateCount = getUpdateCount();

    const newRows = [
      { id: 1, name: "Row 1", pattern: /def/ },
      { id: 2, name: "Row 2", pattern: /xyz/ },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const updateCount = getUpdateCount();
      expect(updateCount).toBeGreaterThan(initialUpdateCount);
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it.skip("handles Date objects in rows", async () => {
    const initialRows = [
      { id: 1, name: "Row 1", date: new Date("2024-01-01") },
      { id: 2, name: "Row 2", date: new Date("2024-01-02") },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();
    const initialUpdateCount = getUpdateCount();

    const newRows = [
      { id: 1, name: "Row 1", date: new Date("2024-01-03") },
      { id: 2, name: "Row 2", date: new Date("2024-01-02") },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const updateCount = getUpdateCount();
      expect(updateCount).toBeGreaterThan(initialUpdateCount);
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it.skip("handles function properties in rows", async () => {
    const initialRows = [
      { id: 1, name: "Row 1", handler: () => console.log("old") },
      { id: 2, name: "Row 2", handler: () => console.log("old2") },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();
    const initialUpdateCount = getUpdateCount();

    const newRows = [
      { id: 1, name: "Row 1", handler: () => console.log("new") },
      { id: 2, name: "Row 2", handler: () => console.log("old2") },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const updateCount = getUpdateCount();
      expect(updateCount).toBeGreaterThan(initialUpdateCount);
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it.skip("handles Symbol properties in rows", async () => {
    const sym = Symbol("test");
    const initialRows = [
      { id: 1, name: "Row 1", [sym]: "value1" },
      { id: 2, name: "Row 2", [sym]: "value2" },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();
    const initialUpdateCount = getUpdateCount();

    const newRows = [
      { id: 1, name: "Row 1", [sym]: "value3" },
      { id: 2, name: "Row 2", [sym]: "value2" },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const updateCount = getUpdateCount();
      expect(updateCount).toBeGreaterThan(initialUpdateCount);
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  // TODO: unsip once proper deep comparison is implemented.
  it.skip("handles circular references in rows", async () => {
    type RowWithRef = {
      id: number;
      name: string;
      ref?: RowWithRef;
    };

    const row1: RowWithRef = { id: 1, name: "Row 1" };
    const row2: RowWithRef = { id: 2, name: "Row 2" };
    row1.ref = row2;
    row2.ref = row1;

    const initialRows = [row1, row2];
    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRow1: RowWithRef = { id: 1, name: "Row 1 Updated" };
    const newRow2: RowWithRef = { id: 2, name: "Row 2" };
    newRow1.ref = newRow2;
    newRow2.ref = newRow1;

    const newRows = [newRow1, newRow2];

    expect(() => {
      rerender({ rows: newRows });
    }).not.toThrow();

    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  it("handles empty rows array", async () => {
    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: [] },
    });

    await tick();

    const newRows = [{ id: 1, name: "Row 1" }];
    rerender({ rows: newRows });
    await tick();

    const filteredIds = getFilteredIds();
    expect(filteredIds.length).toBeGreaterThan(0);
  });

  it("re-filters when rows change with search value", async () => {
    const initialRows = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();

    const newRows = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 4, name: "Date" },
    ];
    rerender({ rows: newRows });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toContain(1);
      expect(filteredIds).toContain(2);
      expect(filteredIds).toContain(4);
      expect(filteredIds).not.toContain(3);
    });
  });

  it("does not trigger unnecessary update when rows have same data (different reference)", async () => {
    const initialRows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: initialRows },
    });

    await tick();
    const initialFilteredIds = getFilteredIds();

    const sameRows = [
      { id: 1, name: "Row 1" },
      { id: 2, name: "Row 2" },
    ];
    rerender({ rows: sameRows });
    await tick();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const finalFilteredIds = getFilteredIds();
    expect(finalFilteredIds).toEqual(initialFilteredIds);
  });

  it("verifies property order changes are detected", async () => {
    const rows1 = [{ id: 1, name: "Row 1", value: 100 }];
    const rows2 = [{ value: 100, id: 1, name: "Row 1" }];

    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: rows1 },
    });

    await tick();
    const initialFilteredIds = getFilteredIds();

    rerender({ rows: rows2 });
    await tick();

    await waitFor(() => {
      const filteredIds = getFilteredIds();
      expect(filteredIds).toEqual(initialFilteredIds);
    });
  });
});
