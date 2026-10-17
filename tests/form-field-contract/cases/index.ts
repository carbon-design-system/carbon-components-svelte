import { screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
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

const listItems = [
  { id: "0", text: "Ada" },
  { id: "1", text: "Grace" },
];

export const cases: FieldCase[] = [
  {
    name: "Dropdown",
    component: Dropdown,
    props: { items: listItems },
    control: () => screen.getByRole("combobox"),
    state: { errorAttribute: "aria-describedby" },
    fluid: {
      className: "bx--list-box__wrapper--fluid",
      wrapper: ".bx--list-box__wrapper--fluid",
      errorAttribute: "aria-describedby",
      ignoredWith: { type: "inline" },
    },
  },
  {
    name: "MultiSelect",
    component: MultiSelect,
    props: { items: listItems },
    control: () => screen.getByRole("combobox"),
    state: { errorAttribute: "aria-describedby" },
    fluid: {
      className: "bx--list-box__wrapper--fluid",
      wrapper: ".bx--list-box__wrapper--fluid",
      errorAttribute: "aria-describedby",
      ignoredWith: { type: "inline" },
    },
  },
  {
    name: "MultiSelect",
    variant: "filterable",
    component: MultiSelect,
    props: { items: listItems, filterable: true },
    control: () => screen.getByRole("combobox"),
    state: { errorAttribute: "aria-describedby" },
    // The filter text is a query, not the submitted value.
    reset: { initial: "Ada", typed: "x", events: ["input"], submits: false },
    selectOnFocus: { value: "Ada" },
  },
  {
    name: "ComboBox",
    component: ComboBox,
    // A custom value makes the typed text the field's value, so a reset has
    // something to clear without picking an item.
    props: {
      items: [
        { id: "0", text: "Ada" },
        { id: "1", text: "Grace" },
      ],
      allowCustomValue: true,
    },
    control: () => screen.getByRole("combobox"),
    state: {},
    fluid: {
      className: "bx--list-box__wrapper--fluid",
      wrapper: ".bx--list-box__wrapper--fluid",
    },
    reset: { initial: "Ada", typed: "x", events: ["input"] },
    selectOnFocus: { value: "Ada" },
  },
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
    // Read-only renders a text input, which NVDA announces as read-only.
    control: () =>
      screen.queryByRole("spinbutton") ?? screen.getByRole("textbox"),
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

const NOT_A_TEXT_FIELD = "not a text field; covered by its own form tests";
const NOT_AUDITED =
  "covered by its own tests; not audited against the contract yet";

export const exempt: Exemptions = {
  fluid: {
    CopyInput: NOT_AUDITED,
    DatePicker: NOT_AUDITED,
  },
  state: {
    DatePickerInput: NOT_AUDITED,
    InputGroup: NOT_AUDITED,
    ListBox: "a wrapper with no control of its own",
    Checkbox: NOT_AUDITED,
    CheckboxGroup: NOT_AUDITED,
    RadioButtonGroup: NOT_AUDITED,
    RangeSlider: NOT_AUDITED,
    Slider: NOT_AUDITED,
    TagInput: NOT_AUDITED,
    Toggle: NOT_AUDITED,
  },
  reset: {
    ListBoxRequiredInput:
      "a hidden validation proxy, covered by tests/ListBox/required-invalid.test.ts",
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
    CopyInput: NOT_AUDITED,
    DatePickerInput: NOT_AUDITED,
    PinCodeInput: "selects the focused segment, which its own tests cover",
    HeaderSearch: "a UI shell search, not a form field",
    SearchMenu: "forwards the prop to Search",
    ToolbarSearch: "forwards the prop to Search",
    Slider: "selects its number input, which its own tests cover",
    RangeSlider: "selects its number inputs, which its own tests cover",
  },
  fluidSkeleton: {
    ComboBox:
      "nests its field placeholder in a list box shape the contract doesn't model",
    CopyInput: NOT_AUDITED,
    DatePicker: NOT_AUDITED,
    Dropdown:
      "nests its field placeholder in a list box shape the contract doesn't model",
    MultiSelect:
      "nests its field placeholder in a list box shape the contract doesn't model",
    TimePicker: "renders select placeholders, which its own tests cover",
  },
};
