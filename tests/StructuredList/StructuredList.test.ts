import { render, screen } from "@testing-library/svelte";
import type StructuredListComponent from "carbon-components-svelte/StructuredList/StructuredList.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { user } from "../utils/user";
import StructuredList from "./StructuredList.test.svelte";
import StructuredListChecked from "./StructuredListChecked.test.svelte";
import StructuredListCustom from "./StructuredListCustom.test.svelte";
import StructuredListCustomIcon from "./StructuredListCustomIcon.test.svelte";
import StructuredListInputStandalone from "./StructuredListInputStandalone.test.svelte";
import StructuredListMultiple from "./StructuredListMultiple.test.svelte";

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
    const { container } = render(StructuredList, {
      props: { selection: true },
    });

    const list = container.querySelector(".bx--structured-list");
    expect(list).toHaveClass("bx--structured-list--selection");
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();

    const inputs = screen.getAllByRole("radio");
    expect(inputs).toHaveLength(3);

    const checkmarks = container.querySelectorAll(
      "svg.bx--structured-list-svg",
    );
    expect(checkmarks).toHaveLength(3);

    for (const checkmark of checkmarks) {
      // The checkmark is decorative; selection state is conveyed by the row.
      expect(checkmark).toHaveAttribute("aria-hidden", "true");
      // The selection icon column shrinks to the icon so it sits flush right.
      expect(checkmark.closest(".bx--structured-list-td")).toHaveStyle({
        width: "1px",
      });
    }
  });

  it("should not place a radio/checkbox role under a table or rowgroup role", () => {
    const { container } = render(StructuredList, {
      props: { selection: true },
    });

    const options = container.querySelectorAll(
      '[role="radio"], [role="checkbox"]',
    );
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.closest('[role="table"], [role="rowgroup"]')).toBeNull();
    }
  });

  it("should give the selection-icon header cell accessible text", () => {
    const { container } = render(StructuredList, {
      props: { selection: true },
    });

    const headerCells = container.querySelectorAll(".bx--structured-list-th");
    const selectionHeaderCell = headerCells[headerCells.length - 1];
    expect(selectionHeaderCell.textContent?.trim()).not.toBe("");
  });

  it("should render a custom selection icon via the `icon` prop", () => {
    const { container } = render(StructuredListCustomIcon);

    // One auto-rendered, decorative icon per selectable row.
    const icons = container.querySelectorAll("svg.bx--structured-list-svg");
    expect(icons).toHaveLength(3);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
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

  it("should activate selectable row via Space/Enter keys", async () => {
    render(StructuredList, { props: { selection: true } });

    const rows = screen.getAllByRole("radio");
    rows[1].focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("value").textContent).toBe("row-2-value");

    rows[2].focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("value").textContent).toBe("row-3-value");
  });

  it("should expose selectable rows as radio with aria-checked", () => {
    render(StructuredList, {
      props: { selection: true, selected: "row-2-value" },
    });

    const rows = screen.getAllByRole("radio");
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.tagName).toBe("LABEL");
    }
    expect(rows[0]).toHaveAttribute("aria-checked", "false");
    expect(rows[1]).toHaveAttribute("aria-checked", "true");
    expect(rows[2]).toHaveAttribute("aria-checked", "false");
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

  it("should not throw when rendered outside a StructuredList", () => {
    expect(() => render(StructuredListInputStandalone)).not.toThrow();
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

  it("should not emit change event on initial render when a child has checked={true}", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredListChecked);

    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
  });

  it("should support multi-select via the `multiple` prop", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredListMultiple);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByTestId("value").textContent).toBe("[]");
    // a11y: each selectable row exposes its checked state to assistive tech.
    for (const checkbox of checkboxes) {
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    }

    await user.click(checkboxes[0]);
    expect(screen.getByTestId("value").textContent).toBe('["row-1-value"]');
    expect(consoleLog).toHaveBeenLastCalledWith("change", ["row-1-value"]);
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "true");

    await user.click(checkboxes[2]);
    expect(screen.getByTestId("value").textContent).toBe(
      '["row-1-value","row-3-value"]',
    );
    expect(checkboxes[2]).toHaveAttribute("aria-checked", "true");

    // toggling re-selects off
    await user.click(checkboxes[0]);
    expect(screen.getByTestId("value").textContent).toBe('["row-3-value"]');
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "false");
  });
});

describe("Generics", () => {
  it("should support custom string literal types with generics", () => {
    type CustomValue = "row1" | "row2" | "row3";

    type ComponentType = StructuredListComponent<CustomValue>;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    expectTypeOf<Props["selected"]>().toEqualTypeOf<
      CustomValue | CustomValue[] | undefined
    >();

    type ChangeEvent = Events["change"];
    type ChangeEventDetail =
      ChangeEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<ChangeEventDetail>().toEqualTypeOf<
      CustomValue | CustomValue[]
    >();
  });

  it("should default to string when generic is not specified", () => {
    type ComponentType = StructuredListComponent;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    expectTypeOf<Props["selected"]>().toEqualTypeOf<
      string | string[] | undefined
    >();

    type ChangeEvent = Events["change"];
    type ChangeEventDetail =
      ChangeEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<ChangeEventDetail>().toEqualTypeOf<string | string[]>();
  });

  it("should provide type-safe access to custom string literal types in event handlers", () => {
    type Status = "pending" | "approved" | "rejected";

    const handleChange = (value: Status | Status[]) => {
      expectTypeOf(value).toEqualTypeOf<Status | Status[]>();
    };

    expectTypeOf(handleChange).parameter(0).toEqualTypeOf<Status | Status[]>();

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
