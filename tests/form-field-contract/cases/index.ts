import { screen } from "@testing-library/svelte";
import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import CodeEditor from "carbon-components-svelte/CodeEditor/CodeEditor.svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
import FluidCopyInputSkeleton from "carbon-components-svelte/CopyInput/FluidCopyInputSkeleton.svelte";
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
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
import FluidTextAreaSkeleton from "carbon-components-svelte/TextArea/FluidTextAreaSkeleton.svelte";
import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
import FluidTextInputSkeleton from "carbon-components-svelte/TextInput/FluidTextInputSkeleton.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
import type { Exemptions, FieldCase } from "../contract";
import CheckboxGroupField from "../fixtures/CheckboxGroupField.test.svelte";
import DatePickerField from "../fixtures/DatePickerField.test.svelte";
import InlineEditField from "../fixtures/InlineEditField.test.svelte";
import RadioButtonGroupField from "../fixtures/RadioButtonGroupField.test.svelte";

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
    name: "CodeEditor",
    component: CodeEditor,
    // The contract leaves a field with Tab, which a code editor spends on
    // indenting.
    props: { indentWithTab: false },
    control: () => screen.getByRole("textbox"),
    reset: { initial: "notes", typed: "x", events: ["input", "change"] },
    state: {},
    fluid: {
      className: "bx--code-editor--fluid",
      wrapper: ".bx--code-editor__wrapper",
    },
  },
  {
    name: "InlineEdit",
    component: InlineEditField,
    control: () => screen.getByRole("textbox"),
    selectOnFocus: { value: "hello world" },
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
  {
    name: "CopyInput",
    component: CopyInput,
    control: () => screen.getByRole("textbox"),
    fluid: {
      className: "bx--text-input--fluid",
      wrapper: ".bx--text-input__field-wrapper",
      ignoredWith: { inline: true },
      skip: { validation: "read-only; has no invalid or warning state" },
    },
    selectOnFocus: { value: "hello world" },
    fluidSkeleton: { component: FluidCopyInputSkeleton, ...textInputSkeleton },
  },
  {
    name: "Slider",
    component: Slider,
    // The thumb and the number input both carry the state. A read-only slider
    // swaps the input for text.
    control: () => [
      screen.getByRole("slider"),
      ...screen.queryAllByRole("spinbutton"),
    ],
    state: { errorAttribute: "aria-describedby" },
  },
  {
    name: "RangeSlider",
    component: RangeSlider,
    control: () => [
      ...screen.getAllByRole("slider"),
      ...screen.queryAllByRole("spinbutton"),
    ],
    state: { errorAttribute: "aria-describedby" },
  },
  {
    name: "DatePicker",
    component: DatePickerField,
    props: { datePickerType: "single" },
    control: () => screen.getByRole("textbox"),
    fluid: {
      className: "bx--date-picker--fluid",
      wrapper: ".bx--date-picker-container",
    },
  },
  {
    name: "DatePickerInput",
    component: DatePickerField,
    control: () => screen.getByRole("textbox"),
    state: {},
    selectOnFocus: { value: "01/01/2023" },
    reset: { initial: "01/01/2023", typed: "x", events: ["input", "change"] },
  },
  {
    name: "TagInput",
    component: TagInput,
    control: () => screen.getByRole("textbox"),
    state: {},
  },
  {
    name: "Toggle",
    component: Toggle,
    control: () => screen.getByRole("switch"),
    state: { errorAttribute: "aria-describedby" },
  },
  {
    name: "Checkbox",
    component: Checkbox,
    control: () => screen.getByRole("checkbox"),
    state: { errorAttribute: "aria-describedby" },
  },
  {
    name: "CheckboxGroup",
    component: CheckboxGroupField,
    // Each checkbox is marked invalid; the fieldset carries the messages.
    control: () => screen.getAllByRole("checkbox"),
    state: {
      errorAttribute: "aria-describedby",
      described: () => screen.getByRole("group"),
    },
  },
  {
    name: "RadioButtonGroup",
    component: RadioButtonGroupField,
    // The radiogroup is marked invalid; each radio carries the messages.
    control: () => screen.getByRole("radiogroup"),
    state: {
      errorAttribute: "aria-describedby",
      described: () => screen.getAllByRole("radio"),
    },
  },
];

const NOT_A_TEXT_FIELD = "not a text field; covered by its own form tests";
const NOT_AUDITED =
  "covered by its own tests; not audited against the contract yet";

export const exempt: Exemptions = {
  fluid: {},
  state: {
    InputGroup: NOT_AUDITED,
    ListBox: "a wrapper with no control of its own",
    StarRating: NOT_AUDITED,
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
    SelectableTile: NOT_A_TEXT_FIELD,
    StarRating: NOT_A_TEXT_FIELD,
    StructuredList: NOT_A_TEXT_FIELD,
    TagInput: NOT_A_TEXT_FIELD,
    TileGroup: NOT_A_TEXT_FIELD,
    Toggle: NOT_A_TEXT_FIELD,
  },
  selectOnFocus: {
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
    DatePicker:
      "wraps its label, field and calendar icon in one container the contract doesn't model",
    Dropdown:
      "nests its field placeholder in a list box shape the contract doesn't model",
    MultiSelect:
      "nests its field placeholder in a list box shape the contract doesn't model",
    TimePicker: "renders select placeholders, which its own tests cover",
  },
};
