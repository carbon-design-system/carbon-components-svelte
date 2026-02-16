import { render, screen } from "@testing-library/svelte";
import type StructuredListComponent from "carbon-components-svelte/StructuredList/StructuredList.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { user } from "../setup-tests";
import StructuredList from "./StructuredList.test.svelte";
import StructuredListCustom from "./StructuredListCustom.test.svelte";

describe("StructuredList", () => {
  it("should render with default props", () => {
    render(StructuredList);

    const list = screen.getByRole("table");
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass("bx--structured-list");

    // Check header cells
    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells).toHaveLength(3);
    expect(headerCells[0]).toHaveTextContent("Column A");
    expect(headerCells[1]).toHaveTextContent("Column B");
    expect(headerCells[2]).toHaveTextContent("Column C");

    // Check body cells
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(9); // 3 rows x 3 columns
    expect(cells[0]).toHaveTextContent("Row 1");
    expect(cells[1]).toHaveTextContent("Row 1");
    expect(cells[2]).toHaveTextContent("Content 1");
  });

  it("should handle condensed variant", () => {
    render(StructuredList, { props: { condensed: true } });

    expect(screen.getByRole("table")).toHaveClass(
      "bx--structured-list--condensed",
    );
  });

  it("should handle flush variant", () => {
    render(StructuredList, { props: { flush: true } });

    expect(screen.getByRole("table")).toHaveClass("bx--structured-list--flush");
  });

  it("should handle selection variant", () => {
    render(StructuredList, { props: { selection: true } });

    const list = screen.getByRole("table");
    expect(list).toHaveClass("bx--structured-list--selection");

    const inputs = screen.getAllByRole("radio");
    expect(inputs).toHaveLength(3);

    const checkmarks = screen.getAllByTitle("select an option");
    expect(checkmarks).toHaveLength(3);
  });

  it("should handle selected state", async () => {
    render(StructuredList, {
      props: { selection: true, selected: "row-1-value" },
    });

    const selectedInput = screen.getByRole("radio", { checked: true });
    expect(selectedInput.closest("label")).toHaveTextContent("Row 1");

    await user.click(screen.getAllByRole("radio")[1]);
    expect(
      screen.getByRole("radio", { checked: true }).closest("label"),
    ).toHaveTextContent("Row 2");
  });

  it("should handle selection change", async () => {
    render(StructuredList, { props: { selection: true } });

    const secondInput = screen.getAllByRole("radio")[1];
    await user.click(secondInput);

    expect(screen.getByTestId("value").textContent).toBe("row-2-value");
  });

  it("should handle custom content", () => {
    render(StructuredListCustom);

    expect(screen.getByTestId("custom-header")).toHaveTextContent(
      "Custom Header",
    );
    expect(screen.getByTestId("custom-content")).toHaveTextContent(
      "Custom Content",
    );
  });

  it("should handle mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredList);

    const list = screen.getByRole("table");

    await user.click(list);
    expect(consoleLog).toHaveBeenCalledWith("click");
    await user.hover(list);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");
    await user.unhover(list);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should handle noWrap cells", () => {
    render(StructuredList);

    const noWrapCells = screen
      .getAllByRole("cell")
      .filter(
        (cell) =>
          cell.textContent?.startsWith("Row") && cell.textContent?.length === 5,
      );

    for (const cell of noWrapCells) {
      expect(cell).toHaveClass("bx--structured-list-td");
    }
  });

  it("should emit change event on selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredList, { props: { selection: true } });

    expect(consoleLog).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("radio")[1]);
    expect(consoleLog).toHaveBeenCalledWith("change", "row-2-value");

    await user.click(screen.getAllByRole("radio")[0]);
    expect(consoleLog).toHaveBeenCalledWith("change", "row-1-value");
  });
});

describe("Generics", () => {
  it("should support custom string literal types with generics", () => {
    type CustomValue = "row1" | "row2" | "row3";

    type ComponentType = StructuredListComponent<CustomValue>;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    expectTypeOf<Props["selected"]>().toEqualTypeOf<CustomValue | undefined>();

    type ChangeEvent = Events["change"];
    type ChangeEventDetail =
      ChangeEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<ChangeEventDetail>().toEqualTypeOf<CustomValue>();
  });

  it("should default to string when generic is not specified", () => {
    type ComponentType = StructuredListComponent;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    expectTypeOf<Props["selected"]>().toEqualTypeOf<string | undefined>();

    type ChangeEvent = Events["change"];
    type ChangeEventDetail =
      ChangeEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<ChangeEventDetail>().toEqualTypeOf<string>();
  });

  it("should provide type-safe access to custom string literal types in event handlers", () => {
    type Status = "pending" | "approved" | "rejected";

    const handleChange = (value: Status) => {
      expectTypeOf(value).toEqualTypeOf<Status>();
      if (value === "pending") {
        expectTypeOf(value).toEqualTypeOf<"pending">();
      }
    };

    expectTypeOf(handleChange).parameter(0).toEqualTypeOf<Status>();

    type ComponentType = StructuredListComponent<Status>;
    type Events = ComponentEvents<ComponentType>;
    type ChangeEvent = Events["change"];
    type ChangeEventDetail =
      ChangeEvent extends CustomEvent<infer T> ? T : never;

    expectTypeOf<ChangeEventDetail>().toEqualTypeOf<
      Parameters<typeof handleChange>[0]
    >();
  });
});
