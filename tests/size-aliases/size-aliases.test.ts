import { cleanup, render } from "@testing-library/svelte";
import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
import AccordionSkeleton from "carbon-components-svelte/Accordion/AccordionSkeleton.svelte";
import Button from "carbon-components-svelte/Button/Button.svelte";
import ButtonSkeleton from "carbon-components-svelte/Button/ButtonSkeleton.svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBoxSkeleton from "carbon-components-svelte/ComboBox/ComboBoxSkeleton.svelte";
import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
import ContentSwitcherSkeleton from "carbon-components-svelte/ContentSwitcher/ContentSwitcherSkeleton.svelte";
import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import DataTableSkeleton from "carbon-components-svelte/DataTable/DataTableSkeleton.svelte";
import Table from "carbon-components-svelte/DataTable/Table.svelte";
import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
import DatePickerSkeleton from "carbon-components-svelte/DatePicker/DatePickerSkeleton.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import DropdownSkeleton from "carbon-components-svelte/Dropdown/DropdownSkeleton.svelte";
import FileDownloadItem from "carbon-components-svelte/FileUploader/FileDownloadItem.svelte";
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
import FileUploaderItem from "carbon-components-svelte/FileUploader/FileUploaderItem.svelte";
import FileUploaderSkeleton from "carbon-components-svelte/FileUploader/FileUploaderSkeleton.svelte";
import ListBox from "carbon-components-svelte/ListBox/ListBox.svelte";
import Modal from "carbon-components-svelte/Modal/Modal.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import MultiSelectSkeleton from "carbon-components-svelte/MultiSelect/MultiSelectSkeleton.svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
import NumberInputSkeleton from "carbon-components-svelte/NumberInput/NumberInputSkeleton.svelte";
import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
import PinCodeInputSkeleton from "carbon-components-svelte/PinCodeInput/PinCodeInputSkeleton.svelte";
import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
import Search from "carbon-components-svelte/Search/Search.svelte";
import SearchSkeleton from "carbon-components-svelte/Search/SearchSkeleton.svelte";
import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
import SearchMenuSkeleton from "carbon-components-svelte/SearchMenu/SearchMenuSkeleton.svelte";
import Select from "carbon-components-svelte/Select/Select.svelte";
import SelectSkeleton from "carbon-components-svelte/Select/SelectSkeleton.svelte";
import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
import Tag from "carbon-components-svelte/Tag/Tag.svelte";
import TagSkeleton from "carbon-components-svelte/Tag/TagSkeleton.svelte";
import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import PasswordInputSkeleton from "carbon-components-svelte/TextInput/PasswordInputSkeleton.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import TextInputSkeleton from "carbon-components-svelte/TextInput/TextInputSkeleton.svelte";
import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
import TimePickerSkeleton from "carbon-components-svelte/TimePicker/TimePickerSkeleton.svelte";
import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
import ToggleSkeleton from "carbon-components-svelte/Toggle/ToggleSkeleton.svelte";
import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
import TreeViewSkeleton from "carbon-components-svelte/TreeView/TreeViewSkeleton.svelte";
import type { ComponentProps } from "svelte";
import DatePickerInput from "./DatePickerInput.test.svelte";

type Size<P extends { size?: unknown }> = P["size"];

/**
 * One case per alias: render the component at the alias and at the name
 * it stands for. `pairs` is typed against the component's own `size`, so
 * an alias the union doesn't list fails the type check.
 */
function aliasCases<P extends { size?: unknown }>(
  name: string,
  renderSized: (size: Size<P>) => void,
  pairs: ReadonlyArray<readonly [NonNullable<Size<P>>, Size<P>]>,
) {
  return pairs.map(([alias, canonical]) => ({
    title: `${name}: "${alias}" renders as ${canonical === undefined ? "the default" : `"${canonical}"`}`,
    renderAlias: () => renderSized(alias),
    renderCanonical: () => renderSized(canonical),
  }));
}

function classesAfter(renderSized: () => void) {
  renderSized();
  const classes = [...document.body.querySelectorAll("*")].map(
    (element) => element.getAttribute("class") ?? "",
  );
  cleanup();
  return classes;
}

const items = [{ id: "us-east-1", text: "US East" }];

const BUTTON = [
  ["sm", "small"],
  ["md", "field"],
  ["2xl", "xl"],
] as const;
const FIELD = [
  ["md", undefined],
  ["lg", "xl"],
] as const;
const MD_UNSET = [["md", undefined]] as const;
const SEARCH = [["md", "lg"]] as const;
const MD_DEFAULT = [["md", "default"]] as const;
const TREE_VIEW = [
  ["sm", "default"],
  ["xs", "compact"],
] as const;
const DATA_TABLE = [
  ["xs", "compact"],
  ["sm", "short"],
  ["md", "medium"],
  ["lg", undefined],
  ["xl", "tall"],
] as const;
const FILE_ITEM = [
  ["sm", "small"],
  ["md", "field"],
  ["lg", "default"],
] as const;

const cases = [
  ...aliasCases<ComponentProps<Button>>(
    "Button",
    (size) => render(Button, { props: { size } }),
    BUTTON,
  ),
  ...aliasCases<ComponentProps<ButtonSkeleton>>(
    "ButtonSkeleton",
    (size) => render(ButtonSkeleton, { props: { size } }),
    BUTTON,
  ),
  ...aliasCases<ComponentProps<FileUploader>>(
    "FileUploader",
    (size) => render(FileUploader, { props: { size } }),
    BUTTON,
  ),
  ...aliasCases<ComponentProps<FileUploaderButton>>(
    "FileUploaderButton",
    (size) => render(FileUploaderButton, { props: { size } }),
    BUTTON,
  ),
  ...aliasCases<ComponentProps<FileUploaderSkeleton>>(
    "FileUploaderSkeleton",
    (size) => render(FileUploaderSkeleton, { props: { size } }),
    BUTTON,
  ),
  ...aliasCases<ComponentProps<FileUploaderItem>>(
    "FileUploaderItem",
    (size) => render(FileUploaderItem, { props: { name: "q3.pdf", size } }),
    FILE_ITEM,
  ),
  ...aliasCases<ComponentProps<FileDownloadItem>>(
    "FileDownloadItem",
    (size) => render(FileDownloadItem, { props: { name: "q3.pdf", size } }),
    FILE_ITEM,
  ),
  ...aliasCases<ComponentProps<TextInput>>(
    "TextInput",
    (size) => render(TextInput, { props: { labelText: "Workspace", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<TextInputSkeleton>>(
    "TextInputSkeleton",
    (size) => render(TextInputSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<PasswordInput>>(
    "PasswordInput",
    (size) => render(PasswordInput, { props: { labelText: "Token", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<PasswordInputSkeleton>>(
    "PasswordInputSkeleton",
    (size) => render(PasswordInputSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<Select>>(
    "Select",
    (size) => render(Select, { props: { labelText: "Plan", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<SelectSkeleton>>(
    "SelectSkeleton",
    (size) => render(SelectSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<NumberInput>>(
    "NumberInput",
    (size) => render(NumberInput, { props: { labelText: "Nodes", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<NumberInputSkeleton>>(
    "NumberInputSkeleton",
    (size) => render(NumberInputSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<DatePickerInput>>(
    "DatePickerInput",
    (size) => render(DatePickerInput, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<DatePickerSkeleton>>(
    "DatePickerSkeleton",
    (size) => render(DatePickerSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<TimePicker>>(
    "TimePicker",
    (size) => render(TimePicker, { props: { labelText: "Start", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<TimePickerSkeleton>>(
    "TimePickerSkeleton",
    (size) => render(TimePickerSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<CopyInput>>(
    "CopyInput",
    (size) =>
      render(CopyInput, { props: { labelText: "Key", value: "sk-1", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<CopyInputSkeleton>>(
    "CopyInputSkeleton",
    (size) => render(CopyInputSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<RichTextEditor>>(
    "RichTextEditor",
    (size) => render(RichTextEditor, { props: { labelText: "Notes", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<TagInput>>(
    "TagInput",
    (size) => render(TagInput, { props: { labelText: "Labels", size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<PinCodeInput>>(
    "PinCodeInput",
    (size) => render(PinCodeInput, { props: { labelText: "Code", size } }),
    [
      ["md", "default"],
      ["lg", "xl"],
    ],
  ),
  ...aliasCases<ComponentProps<PinCodeInputSkeleton>>(
    "PinCodeInputSkeleton",
    (size) => render(PinCodeInputSkeleton, { props: { size } }),
    [
      ["md", "default"],
      ["lg", "xl"],
    ],
  ),
  ...aliasCases<ComponentProps<Accordion>>(
    "Accordion",
    (size) => render(Accordion, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<AccordionSkeleton>>(
    "AccordionSkeleton",
    (size) => render(AccordionSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<ContentSwitcher>>(
    "ContentSwitcher",
    (size) => render(ContentSwitcher, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<ContentSwitcherSkeleton>>(
    "ContentSwitcherSkeleton",
    (size) => render(ContentSwitcherSkeleton, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<OverflowMenu>>(
    "OverflowMenu",
    (size) => render(OverflowMenu, { props: { size } }),
    FIELD,
  ),
  ...aliasCases<ComponentProps<ComboBox>>(
    "ComboBox",
    (size) => render(ComboBox, { props: { labelText: "Region", items, size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<ComboBoxSkeleton>>(
    "ComboBoxSkeleton",
    (size) => render(ComboBoxSkeleton, { props: { size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<Dropdown>>(
    "Dropdown",
    (size) => render(Dropdown, { props: { labelText: "Region", items, size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<DropdownSkeleton>>(
    "DropdownSkeleton",
    (size) => render(DropdownSkeleton, { props: { size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<MultiSelect>>(
    "MultiSelect",
    (size) =>
      render(MultiSelect, { props: { labelText: "Regions", items, size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<MultiSelectSkeleton>>(
    "MultiSelectSkeleton",
    (size) => render(MultiSelectSkeleton, { props: { size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<ListBox>>(
    "ListBox",
    (size) => render(ListBox, { props: { size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<Search>>(
    "Search",
    (size) => render(Search, { props: { labelText: "Search logs", size } }),
    SEARCH,
  ),
  ...aliasCases<ComponentProps<SearchSkeleton>>(
    "SearchSkeleton",
    (size) => render(SearchSkeleton, { props: { size } }),
    SEARCH,
  ),
  ...aliasCases<ComponentProps<SearchMenu>>(
    "SearchMenu",
    (size) => render(SearchMenu, { props: { labelText: "Services", size } }),
    SEARCH,
  ),
  ...aliasCases<ComponentProps<SearchMenuSkeleton>>(
    "SearchMenuSkeleton",
    (size) => render(SearchMenuSkeleton, { props: { size } }),
    SEARCH,
  ),
  ...aliasCases<ComponentProps<Tag>>(
    "Tag",
    (size) => render(Tag, { props: { size } }),
    MD_DEFAULT,
  ),
  ...aliasCases<ComponentProps<SelectableTag>>(
    "SelectableTag",
    (size) => render(SelectableTag, { props: { size } }),
    MD_DEFAULT,
  ),
  ...aliasCases<ComponentProps<OperationalTag>>(
    "OperationalTag",
    (size) => render(OperationalTag, { props: { size } }),
    MD_DEFAULT,
  ),
  ...aliasCases<ComponentProps<TagSkeleton>>(
    "TagSkeleton",
    (size) => render(TagSkeleton, { props: { size } }),
    MD_DEFAULT,
  ),
  ...aliasCases<ComponentProps<Toggle>>(
    "Toggle",
    (size) => render(Toggle, { props: { labelText: "Alerts", size } }),
    MD_DEFAULT,
  ),
  ...aliasCases<ComponentProps<ToggleSkeleton>>(
    "ToggleSkeleton",
    (size) => render(ToggleSkeleton, { props: { size } }),
    MD_DEFAULT,
  ),
  ...aliasCases<ComponentProps<Modal>>(
    "Modal",
    (size) => render(Modal, { props: { size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<ComposedModal>>(
    "ComposedModal",
    (size) => render(ComposedModal, { props: { size } }),
    MD_UNSET,
  ),
  ...aliasCases<ComponentProps<TreeView>>(
    "TreeView",
    (size) => render(TreeView, { props: { labelText: "Files", size } }),
    TREE_VIEW,
  ),
  ...aliasCases<ComponentProps<TreeViewSkeleton>>(
    "TreeViewSkeleton",
    (size) => render(TreeViewSkeleton, { props: { size } }),
    TREE_VIEW,
  ),
  ...aliasCases<ComponentProps<DataTable>>(
    "DataTable",
    (size) =>
      render(DataTable, {
        props: {
          headers: [{ key: "name", value: "Name" }],
          rows: [{ id: "a", name: "api-gateway" }],
          size,
        },
      }),
    DATA_TABLE,
  ),
  ...aliasCases<ComponentProps<Table>>(
    "Table",
    (size) => render(Table, { props: { size } }),
    DATA_TABLE,
  ),
  ...aliasCases<ComponentProps<DataTableSkeleton>>(
    "DataTableSkeleton",
    (size) => render(DataTableSkeleton, { props: { size } }),
    DATA_TABLE,
  ),
  ...aliasCases<ComponentProps<Toolbar>>(
    "Toolbar",
    (size) => render(Toolbar, { props: { size } }),
    [["lg", "default"]],
  ),
];

describe("Carbon v11 size aliases", () => {
  it.each(cases)("$title", ({ renderAlias, renderCanonical }) => {
    expect(classesAfter(renderAlias)).toEqual(classesAfter(renderCanonical));
  });

  it("keeps Button's own lg and xl, which collide with v11", () => {
    const lg = classesAfter(() => render(Button, { props: { size: "lg" } }));
    const xl = classesAfter(() => render(Button, { props: { size: "xl" } }));

    expect(lg.join(" ")).toContain("bx--btn--lg");
    expect(xl.join(" ")).toContain("bx--btn--xl");
  });

  it("keeps Search's own 40px lg, which collides with v11", () => {
    const lg = classesAfter(() => render(Search, { props: { size: "lg" } }));

    expect(lg.join(" ")).toContain("bx--search--lg");
    expect(lg.join(" ")).not.toContain("bx--search--xl");
  });
});

describe("Types", () => {
  it("widens each size union with its aliases", () => {
    expectTypeOf<ComponentProps<Button>["size"]>().toEqualTypeOf<
      | "default"
      | "field"
      | "small"
      | "xs"
      | "lg"
      | "xl"
      | "sm"
      | "md"
      | "2xl"
      | undefined
    >();
    expectTypeOf<ComponentProps<TextInput>["size"]>().toEqualTypeOf<
      "xs" | "sm" | "md" | "lg" | "xl" | undefined
    >();
    expectTypeOf<ComponentProps<Search>["size"]>().toEqualTypeOf<
      "xs" | "sm" | "md" | "lg" | "xl" | undefined
    >();
    expectTypeOf<ComponentProps<DataTable>["size"]>().toEqualTypeOf<
      | "compact"
      | "short"
      | "medium"
      | "tall"
      | "xs"
      | "sm"
      | "md"
      | "lg"
      | "xl"
      | undefined
    >();
    expectTypeOf<ComponentProps<FileUploader>["size"]>().toEqualTypeOf<
      ComponentProps<Button>["size"]
    >();
  });
});
