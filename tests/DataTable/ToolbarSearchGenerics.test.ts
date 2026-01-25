import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ToolbarSearchGenerics from "./ToolbarSearchGenerics.test.svelte";

describe("ToolbarSearch Generics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getFilteredIds = (testId: string) => {
    const element = screen.getByTestId(testId);
    return JSON.parse(element.textContent || "[]");
  };

  describe("String literal IDs with `as const`", () => {
    it("should properly type filteredRowIds as string literal union", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const firstSearchInput = searchInputs[0];

      // Initially, all rows should be filtered (no search)
      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds).toEqual(
          expect.arrayContaining(["row-1", "row-2", "row-3"]),
        );
        expect(filteredIds.length).toBe(3);
      });

      // Type check: filteredIds should be typed as ReadonlyArray<"row-1" | "row-2" | "row-3">
      // This is verified by TypeScript at compile time, but we can verify the runtime values
      await user.type(firstSearchInput, "Laptop");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds).toEqual(["row-1"]);
        expect(filteredIds.length).toBe(1);
      });

      await user.clear(firstSearchInput);
      await user.type(firstSearchInput, "Phone");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds).toEqual(["row-2"]);
        expect(filteredIds.length).toBe(1);
      });
    });

    it("should filter rows correctly with string literal IDs", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const firstSearchInput = searchInputs[0];

      await user.type(firstSearchInput, "999");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds).toEqual(["row-1"]);
      });

      // Clear and search for something that matches multiple rows
      await user.clear(firstSearchInput);
      await user.type(firstSearchInput, "row");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds.length).toBe(3);
        expect(filteredIds).toEqual(
          expect.arrayContaining(["row-1", "row-2", "row-3"]),
        );
      });
    });
  });

  describe("Numeric IDs", () => {
    it("should properly type filteredRowIds as numeric literal union", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const secondSearchInput = searchInputs[1];

      // Initially, all rows should be filtered
      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-2");
        expect(filteredIds).toEqual(expect.arrayContaining([1, 2, 3]));
        expect(filteredIds.length).toBe(3);
      });

      // Type check: filteredIds should be typed as ReadonlyArray<1 | 2 | 3>
      await user.type(secondSearchInput, "Item 1");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-2");
        expect(filteredIds).toEqual([1]);
        expect(filteredIds.length).toBe(1);
      });

      await user.clear(secondSearchInput);
      await user.type(secondSearchInput, "Electronics");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-2");
        expect(filteredIds).toEqual(expect.arrayContaining([1, 3]));
        expect(filteredIds.length).toBe(2);
      });
    });

    it("should filter rows correctly with numeric IDs", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const secondSearchInput = searchInputs[1];

      await user.type(secondSearchInput, "Furniture");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-2");
        expect(filteredIds).toEqual([2]);
      });
    });
  });

  describe("Explicit generic with DataTableRow<string> and custom filter", () => {
    it("should properly type filteredRowIds as string array", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const thirdSearchInput = searchInputs[2];

      // Initially, all rows should be filtered
      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds).toEqual(
          expect.arrayContaining(["prod-1", "prod-2", "prod-3"]),
        );
        expect(filteredIds.length).toBe(3);
      });

      // Type check: filteredIds should be typed as ReadonlyArray<string>
      await user.type(thirdSearchInput, "Widget");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds).toEqual(["prod-1"]);
        expect(filteredIds.length).toBe(1);
      });
    });

    it("should use custom filter function with correct row type", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const thirdSearchInput = searchInputs[2];

      // Custom filter should search by name and id
      await user.type(thirdSearchInput, "prod-2");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds).toEqual(["prod-2"]);
      });

      await user.clear(thirdSearchInput);
      await user.type(thirdSearchInput, "Gadget");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds).toEqual(["prod-2"]);
      });

      // Search by ID prefix
      await user.clear(thirdSearchInput);
      await user.type(thirdSearchInput, "prod");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds.length).toBe(3);
        expect(filteredIds).toEqual(
          expect.arrayContaining(["prod-1", "prod-2", "prod-3"]),
        );
      });
    });

    it("should handle case-insensitive search in custom filter", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const thirdSearchInput = searchInputs[2];

      await user.type(thirdSearchInput, "WIDGET");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds).toEqual(["prod-1"]);
      });

      await user.clear(thirdSearchInput);
      await user.type(thirdSearchInput, "thing");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-3");
        expect(filteredIds).toEqual(["prod-3"]);
      });
    });
  });

  describe("Type safety verification", () => {
    it("should maintain type safety across different row types", async () => {
      render(ToolbarSearchGenerics);

      // Verify that each DataTable maintains its own typed filteredRowIds
      const searchInputs = screen.getAllByRole("searchbox");

      // First table: string literal IDs
      await user.type(searchInputs[0], "Laptop");
      await waitFor(() => {
        const filteredIds1 = getFilteredIds("filtered-ids-1");
        expect(filteredIds1).toEqual(["row-1"]);
        // Type: ReadonlyArray<"row-1" | "row-2" | "row-3">
      });

      // Second table: numeric IDs
      await user.type(searchInputs[1], "Item 2");
      await waitFor(() => {
        const filteredIds2 = getFilteredIds("filtered-ids-2");
        expect(filteredIds2).toEqual([2]);
        // Type: ReadonlyArray<1 | 2 | 3>
      });

      // Third table: string IDs with custom filter
      await user.type(searchInputs[2], "Widget");
      await waitFor(() => {
        const filteredIds3 = getFilteredIds("filtered-ids-3");
        expect(filteredIds3).toEqual(["prod-1"]);
        // Type: ReadonlyArray<string>
      });

      // Verify all three maintain their distinct types
      const filteredIds1 = getFilteredIds("filtered-ids-1");
      const filteredIds2 = getFilteredIds("filtered-ids-2");
      const filteredIds3 = getFilteredIds("filtered-ids-3");

      expect(filteredIds1).toEqual(["row-1"]);
      expect(filteredIds2).toEqual([2]);
      expect(filteredIds3).toEqual(["prod-1"]);
    });
  });

  describe("Empty search behavior", () => {
    it("should return all row IDs when search is empty", async () => {
      render(ToolbarSearchGenerics);

      await waitFor(() => {
        const filteredIds1 = getFilteredIds("filtered-ids-1");
        const filteredIds2 = getFilteredIds("filtered-ids-2");
        const filteredIds3 = getFilteredIds("filtered-ids-3");

        expect(filteredIds1.length).toBe(3);
        expect(filteredIds2.length).toBe(3);
        expect(filteredIds3.length).toBe(3);
      });
    });

    it("should clear filtered IDs when search is cleared", async () => {
      render(ToolbarSearchGenerics);

      const searchInputs = screen.getAllByRole("searchbox");
      const firstSearchInput = searchInputs[0];

      await user.type(firstSearchInput, "Laptop");

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds).toEqual(["row-1"]);
      });

      await user.clear(firstSearchInput);

      await waitFor(() => {
        const filteredIds = getFilteredIds("filtered-ids-1");
        expect(filteredIds.length).toBe(3);
        expect(filteredIds).toEqual(
          expect.arrayContaining(["row-1", "row-2", "row-3"]),
        );
      });
    });
  });
});
