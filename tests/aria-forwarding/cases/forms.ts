import { render, screen } from "@testing-library/svelte";
import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
import DateCalendar from "carbon-components-svelte/DatePicker/DateCalendar.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
import FileUploaderDropContainer from "carbon-components-svelte/FileUploader/FileUploaderDropContainer.svelte";
import Filename from "carbon-components-svelte/FileUploader/Filename.svelte";
import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";
import FormRequirement from "carbon-components-svelte/FormRequirement/FormRequirement.svelte";
import InlineEdit from "carbon-components-svelte/InlineEdit/InlineEdit.svelte";
import InputGroup from "carbon-components-svelte/InputGroup/InputGroup.svelte";
import ListBoxField from "carbon-components-svelte/ListBox/ListBoxField.svelte";
import ListBoxMenu from "carbon-components-svelte/ListBox/ListBoxMenu.svelte";
import ListBoxMenuItem from "carbon-components-svelte/ListBox/ListBoxMenuItem.svelte";
import ListBoxSelection from "carbon-components-svelte/ListBox/ListBoxSelection.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
import Search from "carbon-components-svelte/Search/Search.svelte";
import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import StarRating from "carbon-components-svelte/StarRating/StarRating.svelte";
import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";
import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
import type { AriaEntry } from "../contract";
import DatePickerInputFixture from "../fixtures/DatePickerInput.test.svelte";
import RadioButtonGroupFixture from "../fixtures/RadioButtonGroup.test.svelte";
import SearchMenuItemFixture from "../fixtures/SearchMenuItem.test.svelte";
import SelectFixture from "../fixtures/Select.test.svelte";
import TimePickerSelectFixture from "../fixtures/TimePickerSelect.test.svelte";

const items = [
  { id: "1", text: "One" },
  { id: "2", text: "Two" },
];

const OPEN_API = "open API question";

export const forms: AriaEntry[] = [
  {
    name: "Checkbox",
    render: (attrs) =>
      render(Checkbox, {
        props: { labelText: "Subscribe", helperText: "Weekly", ...attrs },
      }),
    target: () => screen.getByRole("checkbox"),
  },
  {
    name: "TextInput",
    render: (attrs) =>
      render(TextInput, {
        props: { labelText: "Name", helperText: "Full name", ...attrs },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "ComboBox",
    render: (attrs) =>
      render(ComboBox, {
        props: { items, labelText: "Fruit", helperText: "Pick one", ...attrs },
      }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "CommandPalette",
    render: (attrs) =>
      render(CommandPalette, { props: { open: true, items, ...attrs } }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "CopyInput",
    render: (attrs) =>
      render(CopyInput, {
        props: {
          value: "token",
          labelText: "Token",
          helperText: "Keep it secret",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "DateCalendar",
    render: (attrs) => render(DateCalendar, { props: attrs }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "DatePicker",
    exempt: "container; each DatePickerInput carries its own input",
  },
  {
    name: "DatePickerInput",
    render: (attrs) => render(DatePickerInputFixture, { props: attrs }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "Dropdown",
    render: (attrs) =>
      render(Dropdown, {
        props: { items, labelText: "Fruit", helperText: "Pick one", ...attrs },
      }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "FileUploader",
    render: (attrs) =>
      render(FileUploader, {
        props: {
          labelTitle: "Upload",
          labelDescription: "Max 1 MB",
          buttonLabel: "Add file",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "FileUploaderButton",
    render: (attrs) =>
      render(FileUploaderButton, {
        props: { labelText: "Add file", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "FileUploaderDropContainer",
    render: (attrs) =>
      render(FileUploaderDropContainer, {
        props: { labelText: "Drop files here", ...attrs },
      }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Filename",
    variant: "edit",
    render: (attrs) =>
      render(Filename, { props: { status: "edit", ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "Filename",
    variant: "complete",
    render: (attrs) =>
      render(Filename, { props: { status: "complete", ...attrs } }),
    target: () => screen.getByRole("img"),
  },
  {
    name: "FormItem",
    exempt: "container; the slotted control takes the naming",
  },
  {
    name: "FormRequirement",
    render: (attrs) => render(FormRequirement, { props: attrs }),
    target: () => screen.getByRole("alert"),
  },
  {
    name: "InlineEdit",
    render: (attrs) =>
      render(InlineEdit, {
        props: {
          value: "Ada",
          labelText: "Name",
          editLabel: "Edit",
          saveLabel: "Save",
          cancelLabel: "Cancel",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "ListBox",
    exempt: "container; ListBoxField and ListBoxMenu carry the roles",
  },
  {
    name: "ListBoxField",
    render: (attrs) => render(ListBoxField, { props: attrs }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "ListBoxMenu",
    render: (attrs) => render(ListBoxMenu, { props: attrs }),
    target: () => screen.getByRole("listbox"),
  },
  {
    name: "ListBoxMenuItem",
    render: (attrs) => render(ListBoxMenuItem, { props: attrs }),
    target: () => screen.getByRole("option"),
  },
  {
    name: "ListBoxSelection",
    render: (attrs) => render(ListBoxSelection, { props: attrs }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "ListBoxSelection",
    variant: "selection count",
    render: (attrs) =>
      render(ListBoxSelection, { props: { selectionCount: 2, ...attrs } }),
    target: () => screen.getByRole("button"),
  },
  {
    name: "MultiSelect",
    render: (attrs) =>
      render(MultiSelect, {
        props: { items, labelText: "Fruit", helperText: "Pick any", ...attrs },
      }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "MultiSelect",
    variant: "filterable",
    render: (attrs) =>
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          labelText: "Fruit",
          helperText: "Pick any",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "NumberInput",
    render: (attrs) =>
      render(NumberInput, {
        props: { labelText: "Count", helperText: "1 to 10", ...attrs },
      }),
    target: () => screen.getByRole("spinbutton"),
  },
  {
    name: "PasswordInput",
    render: (attrs) =>
      render(PasswordInput, {
        props: { labelText: "Password", helperText: "8+ chars", ...attrs },
      }),
    target: (result) =>
      result.container.querySelector<HTMLElement>("input") as HTMLElement,
  },
  {
    name: "PinCodeInput",
    render: (attrs) =>
      render(PinCodeInput, {
        props: { labelText: "Code", helperText: "Check your email", ...attrs },
      }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "RadioButton",
    render: (attrs) =>
      render(RadioButton, {
        props: { labelText: "Free", value: "free", readonly: true, ...attrs },
      }),
    target: () => screen.getByRole("radio"),
  },
  {
    name: "RadioButtonGroup",
    render: (attrs) => render(RadioButtonGroupFixture, { props: attrs }),
    target: () => screen.getByRole("radiogroup"),
  },
  {
    name: "RangeSlider",
    render: (attrs) =>
      render(RangeSlider, {
        props: { labelText: "Price", helperText: "In USD", ...attrs },
      }),
    target: () => [
      ...screen.getAllByRole("slider"),
      ...screen.getAllByRole("spinbutton"),
    ],
  },
  {
    name: "Search",
    render: (attrs) =>
      render(Search, {
        props: { labelText: "Search", helperText: "By name", ...attrs },
      }),
    target: () => screen.getByRole("searchbox"),
  },
  {
    name: "SearchMenu",
    render: (attrs) =>
      render(SearchMenu, {
        props: { labelText: "Search", readonly: true, ...attrs },
      }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "SearchMenuItem",
    render: (attrs) => render(SearchMenuItemFixture, { props: attrs }),
    target: () => screen.getByRole("option"),
  },
  {
    name: "Select",
    render: (attrs) => render(SelectFixture, { props: attrs }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "Slider",
    render: (attrs) =>
      render(Slider, {
        props: { labelText: "Volume", helperText: "0 to 100", ...attrs },
      }),
    target: () => [screen.getByRole("slider"), screen.getByRole("spinbutton")],
  },
  {
    name: "StructuredListCell",
    render: (attrs) => render(StructuredListCell, { props: attrs }),
    target: () => screen.getByRole("cell"),
  },
  {
    name: "StructuredListCell",
    variant: "sortable",
    render: (attrs) =>
      render(StructuredListCell, {
        props: { head: true, sortable: true, ...attrs },
      }),
    target: () => screen.getByRole("columnheader"),
    skip: {
      "aria-describedby": OPEN_API,
      "aria-labelledby": OPEN_API,
      "aria-label": OPEN_API,
    },
  },
  {
    name: "StructuredListInput",
    render: (attrs) => render(StructuredListInput, { props: attrs }),
    target: () => screen.getByRole("radio"),
  },
  {
    name: "StructuredListRow",
    render: (attrs) => render(StructuredListRow, { props: attrs }),
    target: () => screen.getByRole("row"),
  },
  {
    name: "TagInput",
    render: (attrs) =>
      render(TagInput, {
        props: { labelText: "Tags", helperText: "Press Enter", ...attrs },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "TextArea",
    render: (attrs) =>
      render(TextArea, {
        props: { labelText: "Notes", helperText: "Optional", ...attrs },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "TimePicker",
    render: (attrs) =>
      render(TimePicker, {
        props: { labelText: "Time", helperText: "hh:mm", ...attrs },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "TimePickerSelect",
    render: (attrs) => render(TimePickerSelectFixture, { props: attrs }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "Toggle",
    render: (attrs) =>
      render(Toggle, {
        props: { labelText: "Alerts", readonly: true, ...attrs },
      }),
    target: () => screen.getByRole("switch"),
  },
  {
    name: "FormGroup",
    render: (attrs) =>
      render(FormGroup, {
        props: {
          legendText: "Contact",
          message: true,
          messageText: "Pick at least one",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "NumberInput",
    variant: "text mode",
    render: (attrs) =>
      render(NumberInput, {
        props: {
          labelText: "Price",
          helperText: "In dollars",
          allowDecimal: true,
          ...attrs,
        },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "Select",
    variant: "inline",
    render: (attrs) =>
      render(SelectFixture, { props: { inline: true, ...attrs } }),
    target: () => screen.getByRole("combobox"),
  },
  {
    name: "TimePicker",
    variant: "fluid",
    render: (attrs) =>
      render(TimePicker, {
        props: {
          fluid: true,
          labelText: "Time",
          warn: true,
          warnText: "Outside office hours",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("textbox"),
  },
  {
    name: "CheckboxGroup",
    render: (attrs) =>
      render(CheckboxGroup, {
        props: { legendText: "Topics", helperText: "Pick any", ...attrs },
      }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "CheckboxGroup",
    variant: "invalid",
    render: (attrs) =>
      render(CheckboxGroup, {
        props: {
          legendText: "Topics",
          invalid: true,
          invalidText: "Pick one",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "TileGroup",
    render: (attrs) =>
      render(TileGroup, { props: { legendText: "Plans", ...attrs } }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "InputGroup",
    render: (attrs) =>
      render(InputGroup, {
        props: {
          legendText: "Promo code",
          helperText: "One per order",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("group"),
  },
  {
    name: "StarRating",
    render: (attrs) =>
      render(StarRating, {
        props: { legendText: "Rating", helperText: "Rate the stay", ...attrs },
      }),
    target: () => screen.getByRole("radiogroup"),
  },
  {
    name: "StarRating",
    variant: "read-only",
    render: (attrs) =>
      render(StarRating, {
        props: {
          readonly: true,
          value: 4.5,
          helperText: "212 reviews",
          ...attrs,
        },
      }),
    target: () => screen.getByRole("img"),
  },
  {
    name: "Stepper",
    exempt:
      "container; each step's panel is named by its label, and its buttons by their text",
  },
];
