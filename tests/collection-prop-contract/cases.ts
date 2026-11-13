import { screen } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import DatePicker from "../DatePicker/DatePicker.test.svelte";
import DatePickerSelectedDates from "../DatePicker/DatePickerSelectedDates.test.svelte";
import { getDayByNumber, openCalendar } from "../DatePicker/helpers";
import { openMenu, optionTexts } from "../MultiSelect/helpers";
import SelectableTileGroup from "../Tile/SelectableTileGroup.test.svelte";
import CheckboxGroupField from "../form-field-contract/fixtures/CheckboxGroupField.test.svelte";
import { user } from "../utils/user";
import { type CollectionCase, type Exemptions, inBothModes } from "./contract";

const NAME_HEADER = /Name/;
const PORT_HEADER = /Port/;

const bodyRowTexts = () =>
  screen
    .getAllByRole("row")
    .filter((row) => row.closest("tbody"))
    .map((row) => row.textContent?.trim());

const DISABLED_DAY = "bx--date-picker__day--disabled";

const GROUP_STORE_SAME_ARRAY =
  "the group store already holds the same array, so it is never set";

const checkbox = (name: string) => screen.getByRole("checkbox", { name });

// An expanded node's accessible name includes its children's text.
const treeItem = (text: string) => {
  const item = screen.getByText(text).closest('[role="treeitem"]');
  assert(item);
  return item;
};

const twoRows = [
  { id: "a", name: "Alpha", port: 2 },
  { id: "b", name: "Bravo", port: 1 },
];

const nameHeader = [{ key: "name", value: "Name" }];

const rowCheckbox = (id: string) => {
  const input = document.querySelector(`tr[data-row="${id}"] input`);
  assert(input instanceof HTMLInputElement);
  return input;
};

const expandButton = (id: string) => {
  const button = document.querySelector(
    `button[aria-controls$="expandable-row-${id}"]`,
  );
  assert(button instanceof HTMLButtonElement);
  return button;
};

const treeNodes = () => [
  { id: "a", text: "Alpha", nodes: [{ id: "a1", text: "Alpha 1" }] },
  { id: "b", text: "Bravo", nodes: [{ id: "b1", text: "Bravo 1" }] },
];

export const cases: CollectionCase[] = [
  {
    name: "CheckboxGroup",
    component: CheckboxGroupField,
    prop: "selected",
    initial: () => ["a"],
    replacement: () => ["b"],
    fails: inBothModes(GROUP_STORE_SAME_ARRAY),
    check: async () => {
      expect(checkbox("B")).toBeChecked();
      expect(checkbox("A")).not.toBeChecked();
      await user.click(checkbox("A"));
      expect(checkbox("B")).toBeChecked();
    },
  },
  {
    name: "SelectableTileGroup",
    component: SelectableTileGroup,
    prop: "selected",
    initial: () => ["option1"],
    replacement: () => ["option2"],
    fails: inBothModes(GROUP_STORE_SAME_ARRAY),
    check: async () => {
      expect(checkbox("Option 2")).toBeChecked();
      expect(checkbox("Option 1")).not.toBeChecked();
      await user.click(checkbox("Option 1"));
      expect(checkbox("Option 2")).toBeChecked();
    },
  },
  {
    name: "DatePicker",
    component: DatePicker,
    prop: "disabledDates",
    props: { datePickerType: "single", value: "03/01/2024" },
    initial: () => ["03/15/2024"],
    replacement: () => ["03/16/2024"],
    check: async () => {
      const calendar = await openCalendar();
      expect(getDayByNumber(calendar, 16)).toHaveClass(DISABLED_DAY);
      expect(getDayByNumber(calendar, 15)).not.toHaveClass(DISABLED_DAY);
    },
  },
  {
    name: "DatePicker",
    component: DatePicker,
    prop: "enabledDates",
    // flatpickr shows today's month unless the anchor `value` is enabled.
    props: { datePickerType: "single", value: "03/15/2024" },
    initial: () => ["03/15/2024"],
    replacement: () => ["03/15/2024", "03/16/2024"],
    check: async () => {
      const calendar = await openCalendar();
      expect(getDayByNumber(calendar, 16)).not.toHaveClass(DISABLED_DAY);
      expect(getDayByNumber(calendar, 17)).toHaveClass(DISABLED_DAY);
    },
  },
  {
    name: "DatePicker",
    component: DatePickerSelectedDates,
    prop: "selectedDates",
    initial: () => [new Date(2024, 2, 1)],
    replacement: () => [new Date(2024, 2, 5)],
    check: () => {
      expect(screen.getByLabelText("Date")).toHaveValue("03/05/2024");
    },
  },
  {
    name: "DataTable",
    component: DataTable,
    prop: "rows",
    props: { sortable: true, headers: [{ key: "name", value: "Name" }] },
    initial: () => [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Bravo" },
    ],
    replacement: () => [
      { id: "d", name: "Delta" },
      { id: "c", name: "Charlie" },
    ],
    check: async () => {
      expect(bodyRowTexts()).toEqual(["Delta", "Charlie"]);
      await user.click(screen.getByRole("button", { name: NAME_HEADER }));
      expect(bodyRowTexts()).toEqual(["Charlie", "Delta"]);
    },
  },
  {
    name: "DataTable",
    component: DataTable,
    prop: "headers",
    props: { sortable: true, rows: twoRows },
    initial: () => [{ key: "name", value: "Name" }],
    replacement: () => [{ key: "port", value: "Port" }],
    check: async () => {
      expect(bodyRowTexts()).toEqual(["2", "1"]);
      await user.click(screen.getByRole("button", { name: PORT_HEADER }));
      expect(bodyRowTexts()).toEqual(["1", "2"]);
    },
  },
  {
    name: "DataTable",
    component: DataTable,
    prop: "selectedRowIds",
    props: { selectable: true, headers: nameHeader, rows: twoRows },
    initial: () => ["a"],
    replacement: () => ["b"],
    check: async () => {
      expect(rowCheckbox("b")).toBeChecked();
      expect(rowCheckbox("a")).not.toBeChecked();
      await user.click(rowCheckbox("a"));
      expect(rowCheckbox("b")).toBeChecked();
    },
  },
  {
    name: "DataTable",
    component: DataTable,
    prop: "expandedRowIds",
    props: { expandable: true, headers: nameHeader, rows: twoRows },
    initial: () => ["a"],
    replacement: () => ["b"],
    check: async () => {
      expect(expandButton("b")).toHaveAttribute("aria-expanded", "true");
      expect(expandButton("a")).toHaveAttribute("aria-expanded", "false");
      await user.click(expandButton("a"));
      expect(expandButton("b")).toHaveAttribute("aria-expanded", "true");
    },
  },
  {
    name: "FileUploader",
    component: FileUploader,
    prop: "files",
    props: { status: "edit" },
    initial: () => [new File(["a"], "alpha.txt")],
    replacement: () => [new File(["b"], "bravo.txt")],
    check: () => {
      expect(screen.getByText("bravo.txt")).toBeInTheDocument();
      expect(screen.queryByText("alpha.txt")).not.toBeInTheDocument();
    },
  },
  {
    name: "MultiSelect",
    component: MultiSelect,
    prop: "selectedIds",
    props: {
      labelText: "Contact",
      items: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Bravo" },
      ],
    },
    initial: () => ["a"],
    replacement: () => ["b"],
    check: async () => {
      await openMenu();
      expect(screen.getByRole("option", { name: "Bravo" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    },
  },
  {
    name: "MultiSelect",
    component: MultiSelect,
    prop: "items",
    props: { labelText: "Contact" },
    initial: () => [
      { id: "b", text: "Bravo" },
      { id: "c", text: "Charlie" },
    ],
    replacement: () => [
      { id: "d", text: "Delta" },
      { id: "a", text: "Alpha" },
    ],
    check: async () => {
      await openMenu();
      expect(optionTexts()).toEqual(["Alpha", "Delta"]);
    },
  },
  {
    name: "TreeView",
    component: TreeView,
    prop: "nodes",
    props: { labelText: "Tree" },
    initial: () => [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Bravo" },
    ],
    replacement: () => [{ id: "c", text: "Charlie" }],
    check: async (instance) => {
      (instance as TreeView).showNode("c");
      expect(
        await screen.findByRole("treeitem", { name: "Charlie" }),
      ).toHaveAttribute("aria-selected", "true");
    },
  },
  {
    name: "TreeView",
    component: TreeView,
    prop: "selectedIds",
    props: { labelText: "Tree", nodes: treeNodes() },
    initial: () => ["a"],
    replacement: () => ["b"],
    check: () => {
      expect(treeItem("Bravo")).toHaveAttribute("aria-selected", "true");
      expect(treeItem("Alpha")).toHaveAttribute("aria-selected", "false");
    },
  },
  {
    name: "TreeView",
    component: TreeView,
    prop: "expandedIds",
    props: { labelText: "Tree", nodes: treeNodes() },
    initial: () => ["a"],
    replacement: () => ["b"],
    check: () => {
      expect(treeItem("Bravo")).toHaveAttribute("aria-expanded", "true");
      expect(treeItem("Alpha")).toHaveAttribute("aria-expanded", "false");
    },
  },
  {
    name: "TreeView",
    component: TreeView,
    prop: "checkedIds",
    props: {
      labelText: "Tree",
      selectionMode: "checkbox",
      // "deep" rewrites the ids on mount, and in Svelte 5 a prop the
      // component wrote keeps its own value over the parent's later edits.
      checkMode: "node",
      nodes: [
        { id: "a", text: "Alpha" },
        { id: "b", text: "Bravo" },
      ],
    },
    initial: () => ["a"],
    replacement: () => ["b"],
    check: () => {
      expect(treeItem("Bravo")).toHaveAttribute("aria-checked", "true");
      expect(treeItem("Alpha")).toHaveAttribute("aria-checked", "false");
    },
  },
];

/** Enforced by `coverage.test.ts`, which fails once the component compares the prop by reference. */
export const NO_REFERENCE_CHECK =
  "recomputed from the prop on every update, with no copy or reference check to go stale";
const OUTPUT = "an output the component writes, not read back";
const INTERNAL = "internal, not exported; covered through its parent";

export const exempt: Exemptions = {
  "ComboBox.items": NO_REFERENCE_CHECK,
  "ContextMenuGroup.selectedIds": NO_REFERENCE_CHECK,
  "DataTable.highlightedRowIds": NO_REFERENCE_CHECK,
  "DataTable.nonExpandableRowIds": NO_REFERENCE_CHECK,
  "DataTable.nonSelectableRowIds": NO_REFERENCE_CHECK,
  "DataTableSkeleton.headers": NO_REFERENCE_CHECK,
  "DatePicker.keepOpenFor": NO_REFERENCE_CHECK,
  "Dropdown.items": NO_REFERENCE_CHECK,
  "FileUploader.accept": NO_REFERENCE_CHECK,
  "FileUploaderButton.accept": NO_REFERENCE_CHECK,
  "FileUploaderButton.files": NO_REFERENCE_CHECK,
  "FileUploaderDropContainer.accept": NO_REFERENCE_CHECK,
  "FileUploaderDropContainer.files": NO_REFERENCE_CHECK,
  "FluidForm.actions": NO_REFERENCE_CHECK,
  "Form.actions": NO_REFERENCE_CHECK,
  "HeaderSearch.results": NO_REFERENCE_CHECK,
  "MenuItemGroup.selectedIds": NO_REFERENCE_CHECK,
  "Modal.secondaryButtons": NO_REFERENCE_CHECK,
  "ModalFooter.secondaryButtons": NO_REFERENCE_CHECK,
  "MultiSelect.sortedItems": OUTPUT,
  "PinCodeInput.code": NO_REFERENCE_CHECK,
  "RecursiveList.nodes": NO_REFERENCE_CHECK,
  "Stepper.steps": NO_REFERENCE_CHECK,
  "TagInput.value": NO_REFERENCE_CHECK,
  "TagSetAllTags.tags": INTERNAL,
  "TagSetOverflow.tags": INTERNAL,
  "ToggleButtonGroup.selected": NO_REFERENCE_CHECK,
  "ToolbarBatchActions.selectedIds": NO_REFERENCE_CHECK,
  "ToolbarColumnVisibility.headers": NO_REFERENCE_CHECK,
  "ToolbarSearch.filteredRowIds": OUTPUT,
  "TreeView.indeterminateIds": OUTPUT,
  "TreeViewNodeList.nodes": INTERNAL,
  "VirtualList.items": NO_REFERENCE_CHECK,
};
