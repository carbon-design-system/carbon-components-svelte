import { screen } from "@testing-library/svelte";
import FluidNumberInputSkeleton from "carbon-components-svelte/NumberInput/FluidNumberInputSkeleton.svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
import FluidPinCodeInputSkeleton from "carbon-components-svelte/PinCodeInput/FluidPinCodeInputSkeleton.svelte";
import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
import FluidSearchSkeleton from "carbon-components-svelte/Search/FluidSearchSkeleton.svelte";
import Search from "carbon-components-svelte/Search/Search.svelte";
import FluidSelectSkeleton from "carbon-components-svelte/Select/FluidSelectSkeleton.svelte";
import Select from "carbon-components-svelte/Select/Select.svelte";
import FluidTextAreaSkeleton from "carbon-components-svelte/TextArea/FluidTextAreaSkeleton.svelte";
import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
import FluidTextInputSkeleton from "carbon-components-svelte/TextInput/FluidTextInputSkeleton.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
import type { Exemptions, FieldCase } from "../contract";

const textInputSkeleton = {
  className: "bx--text-input--fluid__skeleton",
  field: "bx--text-input",
};

export const cases: FieldCase[] = [
  {
    name: "TextInput",
    component: TextInput,
    control: () => screen.getByRole("textbox"),
    reset: { initial: "ada", typed: "x", events: ["input", "change"] },
    state: {},
    fluid: {
      className: "bx--text-input--fluid",
      wrapper: ".bx--text-input__field-wrapper",
      ignoredWith: { inline: true },
    },
    selectOnFocus: { value: "hello world" },
    fluidSkeleton: { component: FluidTextInputSkeleton, ...textInputSkeleton },
  },
  {
    name: "PasswordInput",
    component: PasswordInput,
    control: () => screen.getByLabelText("Field", { selector: "input" }),
    reset: { initial: "s3cret", typed: "x", events: ["input", "change"] },
    state: {},
    fluid: {
      className: "bx--text-input--fluid",
      wrapper: ".bx--text-input__field-wrapper",
      ignoredWith: { inline: true },
    },
    selectOnFocus: { value: "hello world" },
  },
  {
    name: "TextArea",
    component: TextArea,
    control: () => screen.getByRole("textbox"),
    reset: { initial: "notes", typed: "x", events: ["input", "change"] },
    state: {},
    fluid: {
      className: "bx--text-area--fluid",
      wrapper: ".bx--text-area__wrapper",
    },
    selectOnFocus: { value: "hello world" },
    fluidSkeleton: {
      component: FluidTextAreaSkeleton,
      className: "bx--text-area--fluid__skeleton",
      field: "bx--text-area",
    },
  },
  {
    name: "NumberInput",
    component: NumberInput,
    control: () => screen.getByRole("spinbutton"),
    state: {},
    fluid: {
      className: "bx--number-input--fluid",
      wrapper: ".bx--number__input-wrapper",
    },
    selectOnFocus: { value: 42 },
    fluidSkeleton: {
      component: FluidNumberInputSkeleton,
      ...textInputSkeleton,
    },
  },
  {
    name: "Select",
    component: Select,
    control: () => screen.getByRole("combobox"),
    state: { errorAttribute: "aria-describedby" },
    fluid: {
      className: "bx--select--fluid",
      wrapper: ".bx--select-input__wrapper",
      errorAttribute: "aria-describedby",
      ignoredWith: { inline: true },
    },
    fluidSkeleton: {
      component: FluidSelectSkeleton,
      className: "bx--select--fluid__skeleton",
      field: "bx--select",
    },
  },
  {
    name: "Search",
    component: Search,
    control: () => screen.getByRole("searchbox"),
    reset: { initial: "shoes", typed: "x", events: ["input", "change"] },
    state: {},
    fluid: {
      className: "bx--search--fluid",
      wrapper: ".bx--search",
      ignoredWith: { expandable: true },
      skip: {
        messagesInWrapper:
          "Search renders its messages below the field in both variants",
      },
    },
    selectOnFocus: { value: "hello world" },
    fluidSkeleton: { component: FluidSearchSkeleton, ...textInputSkeleton },
  },
  {
    name: "TimePicker",
    component: TimePicker,
    control: () => screen.getByRole("textbox"),
    reset: { initial: "9:30", typed: "1", events: ["input", "change"] },
    state: {},
    fluid: {
      className: "bx--time-picker--fluid",
      wrapper: ".bx--time-picker--fluid",
    },
    selectOnFocus: { value: "10:30" },
  },
  {
    name: "PinCodeInput",
    component: PinCodeInput,
    control: () => screen.getAllByRole("textbox"),
    reset: {
      initial: "12",
      typed: "34",
      events: ["change"],
      serverDefault: (value) => {
        const segments = screen.getAllByRole("textbox");
        assert(segments.every((s) => s instanceof HTMLInputElement));
        [...value].forEach((char, i) => {
          (segments[i] as HTMLInputElement).defaultValue = char;
        });
      },
    },
    state: {
      // The fieldset carries the description for all segments.
      described: () => screen.getByRole("group"),
    },
    fluid: {
      className: "bx--pin-code-input--fluid",
      wrapper: ".bx--pin-code-input__fields",
    },
    fluidSkeleton: {
      component: FluidPinCodeInputSkeleton,
      className: "bx--pin-code-input--fluid__skeleton",
      field: "bx--text-input",
    },
  },
];

const LISTBOX_AUDIT = "covered by its own tests until the listbox family audit";
const NOT_A_TEXT_FIELD = "not a text field; covered by its own form tests";
const NOT_AUDITED =
  "covered by its own tests; not audited against the contract yet";

export const exempt: Exemptions = {
  fluid: {
    ComboBox: LISTBOX_AUDIT,
    CopyInput: LISTBOX_AUDIT,
    DatePicker: LISTBOX_AUDIT,
    Dropdown: LISTBOX_AUDIT,
    MultiSelect: LISTBOX_AUDIT,
  },
  state: {
    ComboBox: LISTBOX_AUDIT,
    DatePickerInput: LISTBOX_AUDIT,
    Dropdown: LISTBOX_AUDIT,
    ListBox: LISTBOX_AUDIT,
    MultiSelect: LISTBOX_AUDIT,
    Checkbox: NOT_AUDITED,
    CheckboxGroup: NOT_AUDITED,
    RadioButtonGroup: NOT_AUDITED,
    RangeSlider: NOT_AUDITED,
    Slider: NOT_AUDITED,
    TagInput: NOT_AUDITED,
    Toggle: NOT_AUDITED,
  },
  reset: {
    ComboBox: LISTBOX_AUDIT,
    ListBoxRequiredInput: LISTBOX_AUDIT,
    MultiSelect: LISTBOX_AUDIT,
    NumberInput: "keeps its value on reset unless allowEmpty is set",
    Checkbox: NOT_A_TEXT_FIELD,
    DataTable: NOT_A_TEXT_FIELD,
    FileUploaderButton: NOT_A_TEXT_FIELD,
    FileUploaderDropContainer: NOT_A_TEXT_FIELD,
    RadioButton: NOT_A_TEXT_FIELD,
    RadioButtonGroup: NOT_A_TEXT_FIELD,
    RadioTile: NOT_A_TEXT_FIELD,
    StructuredList: NOT_A_TEXT_FIELD,
    TagInput: NOT_A_TEXT_FIELD,
    TileGroup: NOT_A_TEXT_FIELD,
    Toggle: NOT_A_TEXT_FIELD,
  },
  selectOnFocus: {
    ComboBox: LISTBOX_AUDIT,
    CopyInput: LISTBOX_AUDIT,
    DatePickerInput: LISTBOX_AUDIT,
    MultiSelect: LISTBOX_AUDIT,
    PinCodeInput: "selects the focused segment, which its own tests cover",
    HeaderSearch: "a UI shell search, not a form field",
    SearchMenu: "forwards the prop to Search",
    ToolbarSearch: "forwards the prop to Search",
    Slider: "selects its number input, which its own tests cover",
    RangeSlider: "selects its number inputs, which its own tests cover",
  },
  fluidSkeleton: {
    ComboBox: LISTBOX_AUDIT,
    CopyInput: LISTBOX_AUDIT,
    DatePicker: LISTBOX_AUDIT,
    Dropdown: LISTBOX_AUDIT,
    MultiSelect: LISTBOX_AUDIT,
    TimePicker: "renders select placeholders, which its own tests cover",
  },
};
