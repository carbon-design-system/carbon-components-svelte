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
import StructuredListUnnamed from "./StructuredListUnnamed.test.svelte";

// Excludes the header's "Select all rows" checkbox.
const getRowCheckboxes = () =>
  screen
    .getAllByRole("checkbox")
    .filter((checkbox) =>
      checkbox.classList.contains("bx--structured-list-input"),
    );

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
      'input[type="radio"], input[type="checkbox"]',
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

  it("should follow the `selected` prop when the parent changes it", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { rerender } = render(StructuredList, {
      props: { selection: true, selected: "row-2-value" },
    });

    expect(
      screen.getByRole("radio", { checked: true }).closest("label"),
    ).toHaveTextContent("Row 2");

    consoleLog.mockClear();
    await rerender({ selected: "row-1-value" });

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());

    await user.click(radios[1]);
    expect(consoleLog).toHaveBeenCalledWith("change", "row-2-value");
    expect(radios[1]).toBeChecked();
  });

  it("should apply the selected class only to the selected row", async () => {
    const { container } = render(StructuredList, {
      props: { selection: true, selected: "row-1-value" },
    });

    const rows = container.querySelectorAll(".bx--structured-list-row");
    // rows[0] is the header row
    expect(rows[1]).toHaveClass("bx--structured-list-row--selected");
    expect(rows[2]).not.toHaveClass("bx--structured-list-row--selected");
    expect(rows[3]).not.toHaveClass("bx--structured-list-row--selected");

    await user.click(screen.getAllByRole("radio")[1]);

    expect(rows[1]).not.toHaveClass("bx--structured-list-row--selected");
    expect(rows[2]).toHaveClass("bx--structured-list-row--selected");
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

  it("should expose selectable rows as native radio inputs with correct checked state", () => {
    render(StructuredList, {
      props: { selection: true, selected: "row-2-value" },
    });

    const rows = screen.getAllByRole("radio");
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.tagName).toBe("INPUT");
    }
    expect(rows[0]).not.toBeChecked();
    expect(rows[1]).toBeChecked();
    expect(rows[2]).not.toBeChecked();
  });

  it("should wrap the native input in a table-cell so it doesn't leave a stray anonymous column", () => {
    // Regression: an unwrapped, visually-hidden input sitting directly
    // between two `.bx--structured-list-td` cells makes the browser's CSS
    // table auto-layout allocate it an oversized anonymous column, opening
    // a visible gap between cells. The wrapper must be a real table cell.
    const { container } = render(StructuredList, {
      props: { selection: true, selected: "row-2-value" },
    });

    const wrappers = container.querySelectorAll(
      ".bx--structured-list-input-wrapper",
    );
    expect(wrappers.length).toBeGreaterThan(0);
    for (const wrapper of wrappers) {
      expect(wrapper.tagName).toBe("SPAN");
      expect(wrapper.querySelector('input[type="radio"]')).not.toBeNull();
      expect(
        wrapper.parentElement?.classList.contains("bx--structured-list-row"),
      ).toBe(true);
    }

    const checkedWrapper = screen
      .getByRole("radio", { checked: true })
      .closest(".bx--structured-list-input-wrapper");
    expect(checkedWrapper).toHaveClass(
      "bx--structured-list-input-wrapper--checked",
    );

    const uncheckedWrappers = [...wrappers].filter(
      (wrapper) => wrapper !== checkedWrapper,
    );
    expect(uncheckedWrappers.length).toBeGreaterThan(0);
    for (const wrapper of uncheckedWrappers) {
      expect(wrapper).not.toHaveClass(
        "bx--structured-list-input-wrapper--checked",
      );
    }
  });

  it('should not put role="radio"/"checkbox" on the <label> element', () => {
    const { container } = render(StructuredList, {
      props: { selection: true },
    });

    const labels = container.querySelectorAll("label.bx--structured-list-row");
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label).not.toHaveAttribute("role");
      expect(label).not.toHaveAttribute("aria-checked");
    }
  });

  it("should keep the native input focusable and keyboard-toggleable", () => {
    const { container } = render(StructuredList, {
      props: { selection: true },
    });

    const inputs = container.querySelectorAll(
      'input[type="radio"], input[type="checkbox"]',
    );
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect(input).toHaveAttribute("tabindex", "0");
    }
  });

  it("should group unnamed single-select inputs under one name", async () => {
    render(StructuredListUnnamed);

    const radios = screen.getAllByRole("radio");
    const name = radios[0].getAttribute("name");
    expect(name).toBeTruthy();
    for (const radio of radios) {
      expect(radio).toHaveAttribute("name", name);
      expect(radio).toHaveAttribute("tabindex", "0");
    }

    radios[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(radios[1]).toBeChecked();
  });

  it("should keep an author-set input name", () => {
    render(StructuredList, { props: { selection: true } });

    expect(screen.getByTitle("row-1-title")).toHaveAttribute(
      "name",
      "row-1-name",
    );
  });

  it("should not share a name across multiple-select inputs", () => {
    render(StructuredListMultiple);

    for (const checkbox of getRowCheckboxes()) {
      expect(checkbox).toHaveAttribute("name", "");
    }
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

  it("does not render a title attribute by default", () => {
    const { container } = render(StructuredListInputStandalone);
    const input = container.querySelector("input");
    expect(input).not.toHaveAttribute("title");
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

  it("should expose aria-sort only on a sortable column header", () => {
    const { container } = render(StructuredList, {
      props: { sortable: true },
    });

    const sortableHeader = container.querySelector(
      ".bx--structured-list-th--sortable",
    );
    expect(sortableHeader).toHaveAttribute("role", "columnheader");
    expect(sortableHeader).toHaveAttribute("aria-sort", "none");
  });

  it("should not put aria-sort on a sortable header cell in a selection list", () => {
    render(StructuredList, {
      props: { sortable: true, selection: true },
    });

    const sortButton = screen.getByRole("button", { name: /sort rows/i });
    const sortHeaderCell = sortButton.closest(
      ".bx--structured-list-th--sortable",
    );
    expect(sortHeaderCell).not.toHaveAttribute("role", "columnheader");
    expect(sortHeaderCell).not.toHaveAttribute("aria-sort");
  });

  it("should still fire the sort event when clicked in a selection list", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredList, { props: { sortable: true, selection: true } });

    await user.click(screen.getByRole("button", { name: /sort rows/i }));
    expect(consoleLog).toHaveBeenCalledWith("sort");
  });

  it("should switch input type and body role when `multiple` changes", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container, rerender } = render(StructuredList, {
      props: { selection: true, multiple: false, selected: "row-2-value" },
    });
    const body = container.querySelector(".bx--structured-list-tbody");

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(body).toHaveAttribute("role", "radiogroup");

    consoleLog.mockClear();
    await rerender({ multiple: true });

    const checkboxes = getRowCheckboxes();
    expect(checkboxes).toHaveLength(3);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(body).toHaveAttribute("role", "group");
    expect(checkboxes[1]).toBeChecked();
    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());

    await user.click(checkboxes[0]);
    expect(consoleLog).toHaveBeenCalledWith("change", [
      "row-2-value",
      "row-1-value",
    ]);

    consoleLog.mockClear();
    await rerender({ multiple: false });

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(body).toHaveAttribute("role", "radiogroup");
    expect(radios[1]).toBeChecked();
    expect(radios[0]).not.toBeChecked();
    expect(screen.getByTestId("value").textContent).toBe("row-2-value");
    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
  });

  it("should support multi-select via the `multiple` prop", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredListMultiple);

    const checkboxes = getRowCheckboxes();
    expect(checkboxes).toHaveLength(3);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByTestId("value").textContent).toBe("[]");
    // a11y: each selectable row's native input exposes its checked state.
    for (const checkbox of checkboxes) {
      expect(checkbox).not.toBeChecked();
    }

    await user.click(checkboxes[0]);
    expect(screen.getByTestId("value").textContent).toBe('["row-1-value"]');
    expect(consoleLog).toHaveBeenLastCalledWith("change", ["row-1-value"]);
    expect(checkboxes[0]).toBeChecked();

    await user.click(checkboxes[2]);
    expect(screen.getByTestId("value").textContent).toBe(
      '["row-1-value","row-3-value"]',
    );
    expect(checkboxes[2]).toBeChecked();

    // toggling re-selects off
    await user.click(checkboxes[0]);
    expect(screen.getByTestId("value").textContent).toBe('["row-3-value"]');
    expect(checkboxes[0]).not.toBeChecked();
  });

  it("should select and clear every row from the header checkbox", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredListMultiple);

    const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });
    const checkboxes = getRowCheckboxes();
    expect(selectAll).not.toBeChecked();

    await user.click(selectAll);
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeChecked();
    }
    expect(selectAll).toBeChecked();
    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith("change", [
      "row-1-value",
      "row-2-value",
      "row-3-value",
    ]);

    consoleLog.mockClear();
    await user.click(selectAll);
    for (const checkbox of checkboxes) {
      expect(checkbox).not.toBeChecked();
    }
    expect(selectAll).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith("change", []);
  });

  it("should mark the header checkbox indeterminate when some rows are selected", async () => {
    render(StructuredListMultiple);

    const selectAll = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Select all rows",
    });
    expect(selectAll.indeterminate).toBe(false);

    await user.click(getRowCheckboxes()[0]);
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll).not.toBeChecked();
  });

  it("should not render a select-all checkbox when `multiple` is false", () => {
    render(StructuredList, { props: { selection: true, multiple: false } });

    expect(
      screen.queryByRole("checkbox", { name: "Select all rows" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Select row")).toHaveClass("bx--visually-hidden");
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
