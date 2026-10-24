import { fireEvent, render, screen } from "@testing-library/svelte";
import axe from "axe-core";
import type StructuredListComponent from "carbon-components-svelte/StructuredList/StructuredList.svelte";
import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";
import CheckmarkOutline from "carbon-icons-svelte/lib/CheckmarkOutline.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { user } from "../utils/user";
import StructuredList from "./StructuredList.test.svelte";
import StructuredListCustom from "./StructuredListCustom.test.svelte";
import StructuredListInputStandalone from "./StructuredListInputStandalone.test.svelte";
import StructuredListSort from "./StructuredListSort.test.svelte";

const multipleProps = { selection: true, multiple: true };

describe("StructuredList", () => {
  it("should render with default props", () => {
    render(StructuredList);

    const list = screen.getByRole("table");
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass("bx--structured-list");

    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells).toHaveLength(3);
    expect(headerCells[0]).toHaveTextContent("Column A");
    expect(headerCells[1]).toHaveTextContent("Column B");
    expect(headerCells[2]).toHaveTextContent("Column C");

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

  it("leaves the selection-icon header cell empty, since selection drops the table roles", async () => {
    const { container } = render(StructuredList, {
      props: { selection: true },
    });

    const headerCells = container.querySelectorAll(".bx--structured-list-th");
    const selectionHeaderCell = headerCells[headerCells.length - 1];
    expect(selectionHeaderCell).not.toHaveAttribute("role");
    expect(selectionHeaderCell.textContent?.trim()).toBe("");

    const results = await axe.run(container, {
      runOnly: ["empty-table-header", "aria-required-parent"],
    });
    expect(results.violations).toEqual([]);
  });

  it("should render a custom selection icon via the `icon` prop", () => {
    const pathOf = (component: typeof CheckmarkOutline) => {
      const { container, unmount } = render(component);
      const d = container.querySelector("path")?.getAttribute("d");
      unmount();
      return d;
    };
    const outlinePath = pathOf(CheckmarkOutline);
    expect(outlinePath).toBeTruthy();
    expect(outlinePath).not.toBe(pathOf(CheckmarkFilled));

    const { container } = render(StructuredList, {
      props: { selection: true, icon: CheckmarkOutline },
    });

    // One auto-rendered, decorative icon per selectable row.
    const icons = container.querySelectorAll("svg.bx--structured-list-svg");
    expect(icons).toHaveLength(3);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon.querySelector("path")?.getAttribute("d")).toBe(outlinePath);
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
    const onChange = vi.fn();
    const { rerender } = render(StructuredList, {
      props: { selection: true, selected: "row-2-value", onChange },
    });

    expect(
      screen.getByRole("radio", { checked: true }).closest("label"),
    ).toHaveTextContent("Row 2");

    onChange.mockClear();
    await rerender({ selected: "row-1-value" });

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith("row-2-value");
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

  it("should group unnamed single-select inputs under one name", async () => {
    render(StructuredList, { props: { selection: true, unnamed: true } });

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
    render(StructuredList, {
      props: { ...multipleProps, unnamed: true },
    });

    for (const checkbox of screen.getAllByRole("checkbox")) {
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
    const onClick = vi.fn();
    const onMouseOver = vi.fn();
    const onMouseLeave = vi.fn();
    render(StructuredList, { props: { onClick, onMouseOver, onMouseLeave } });

    const list = screen.getByRole("table");

    await user.click(list);
    expect(onClick).toHaveBeenCalled();
    await user.hover(list);
    expect(onMouseOver).toHaveBeenCalled();
    await user.unhover(list);
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it("should handle noWrap cells", () => {
    render(StructuredList);

    // Each row renders [noWrap cell, plain cell, plain cell].
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(9);
    cells.forEach((cell, index) => {
      if (index % 3 === 0) {
        expect(cell).toHaveClass("bx--structured-list-content--nowrap");
      } else {
        expect(cell).not.toHaveClass("bx--structured-list-content--nowrap");
      }
    });
  });

  it("does not render a title attribute by default", () => {
    const { container } = render(StructuredListInputStandalone);
    const input = container.querySelector("input");
    expect(input).not.toHaveAttribute("title");
  });

  it("should emit change event on selection", async () => {
    const onChange = vi.fn();
    render(StructuredList, { props: { selection: true, onChange } });

    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("radio")[1]);
    expect(onChange).toHaveBeenCalledWith("row-2-value");

    await user.click(screen.getAllByRole("radio")[0]);
    expect(onChange).toHaveBeenCalledWith("row-1-value");
  });

  it("should select a row with checked={true} on initial render without emitting change", () => {
    const onChange = vi.fn();
    render(StructuredList, {
      props: { selection: true, checkedValue: "row-2-value", onChange },
    });

    expect(onChange).not.toHaveBeenCalled();
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
    expect(screen.getByTestId("value")).toHaveTextContent("row-2-value");
  });

  it("should mark only the row mounted with checked={true} as selected", () => {
    const { container } = render(StructuredList, {
      props: { selection: true, checkedValue: "row-2-value" },
    });

    const rows = container.querySelectorAll(".bx--structured-list-row");
    // rows[0] is the header row
    expect(rows[1]).not.toHaveClass("bx--structured-list-row--selected");
    expect(rows[2]).toHaveClass("bx--structured-list-row--selected");
    expect(rows[3]).not.toHaveClass("bx--structured-list-row--selected");
  });

  it("should check a standalone input when it is clicked", async () => {
    const { container } = render(StructuredListInputStandalone);
    const input = screen.getByRole("radio");
    const wrapper = container.querySelector(
      ".bx--structured-list-input-wrapper",
    );

    expect(wrapper).not.toHaveClass(
      "bx--structured-list-input-wrapper--checked",
    );

    await user.click(input);

    expect(wrapper).toHaveClass("bx--structured-list-input-wrapper--checked");
  });

  it("should apply a `name` set after mount to unnamed inputs", async () => {
    const { rerender } = render(StructuredList, {
      props: { selection: true, unnamed: true, name: "before" },
    });
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "before");
    }

    await rerender({ name: "after" });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "after");
    }
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
    const onSort = vi.fn();
    render(StructuredList, {
      props: { sortable: true, selection: true, onSort },
    });

    await user.click(screen.getByRole("button", { name: /sort rows/i }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  describe("sortable header cell", () => {
    const iconLabel = (container: HTMLElement) =>
      container
        .querySelector(".bx--structured-list-sort__icon")
        ?.getAttribute("aria-label");

    it.each([
      // active, sortDirection, sortAlways, next direction, aria-sort, order in label
      [false, "none", false, "ascending", "none", "ascending"],
      [false, "descending", false, "ascending", "none", "ascending"],
      [true, "none", false, "ascending", "none", "descending"],
      [true, "ascending", false, "descending", "ascending", "descending"],
      [true, "descending", false, "none", "descending", "ascending"],
      [true, "descending", true, "ascending", "descending", "ascending"],
    ] as const)(
      "active=%s, sortDirection=%s, sortAlways=%s: emits %s, aria-sort=%s, labels %s",
      async (active, sortDirection, sortAlways, next, ariaSort, order) => {
        const onSort = vi.fn();
        const { container } = render(StructuredListSort, {
          props: { active, sortDirection, sortAlways, onSort },
        });

        expect(screen.getByRole("columnheader")).toHaveAttribute(
          "aria-sort",
          ariaSort,
        );
        expect(iconLabel(container)).toContain(`${order} order`);

        await user.click(screen.getByRole("button"));

        expect(onSort).toHaveBeenCalledWith({ direction: next });
      },
    );
  });

  it("should switch input type and body role when `multiple` changes", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(StructuredList, {
      props: {
        selection: true,
        multiple: false,
        selected: "row-2-value",
        onChange,
      },
    });
    const body = container.querySelector(".bx--structured-list-tbody");

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(body).toHaveAttribute("role", "radiogroup");

    onChange.mockClear();
    await rerender({ multiple: true });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(body).toHaveAttribute("role", "group");
    expect(checkboxes[1]).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledWith(["row-2-value", "row-1-value"]);

    onChange.mockClear();
    await rerender({ multiple: false });

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(body).toHaveAttribute("role", "radiogroup");
    expect(radios[1]).toBeChecked();
    expect(radios[0]).not.toBeChecked();
    expect(screen.getByTestId("value").textContent).toBe("row-2-value");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should support multi-select via the `multiple` prop", async () => {
    const onChange = vi.fn();
    render(StructuredList, { props: { ...multipleProps, onChange } });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByTestId("value").textContent).toBe("[]");
    // a11y: each selectable row's native input exposes its checked state.
    for (const checkbox of checkboxes) {
      expect(checkbox).not.toBeChecked();
    }

    await user.click(checkboxes[0]);
    expect(screen.getByTestId("value").textContent).toBe('["row-1-value"]');
    expect(onChange).toHaveBeenLastCalledWith(["row-1-value"]);
    expect(checkboxes[0]).toBeChecked();

    await user.click(checkboxes[2]);
    expect(screen.getByTestId("value").textContent).toBe(
      '["row-1-value","row-3-value"]',
    );
    expect(checkboxes[2]).toBeChecked();

    await user.click(checkboxes[0]);
    expect(screen.getByTestId("value").textContent).toBe('["row-3-value"]');
    expect(checkboxes[0]).not.toBeChecked();
  });

  it("should wrap a single `selected` value in an array in `multiple` mode", async () => {
    const { rerender } = render(StructuredList, {
      props: { ...multipleProps, selected: "row-1-value" },
    });
    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toBeChecked();
    expect(screen.getByTestId("value").textContent).toBe('["row-1-value"]');

    await rerender({ selected: "row-2-value" });

    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(screen.getByTestId("value").textContent).toBe('["row-2-value"]');
  });

  it("should toggle a checkbox once when Enter is held down", async () => {
    render(StructuredList, { props: multipleProps });
    const checkbox = screen.getAllByRole("checkbox")[0];

    await fireEvent.keyDown(checkbox, { key: "Enter" });
    await fireEvent.keyDown(checkbox, { key: "Enter", repeat: true });

    expect(checkbox).toBeChecked();
    expect(screen.getByTestId("value").textContent).toBe('["row-1-value"]');
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
});
