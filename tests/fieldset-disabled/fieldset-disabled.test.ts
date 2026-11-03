import { fireEvent, render, screen } from "@testing-library/svelte";
import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
import FileUploaderDropContainer from "carbon-components-svelte/FileUploader/FileUploaderDropContainer.svelte";
import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
import Search from "carbon-components-svelte/Search/Search.svelte";
import Select from "carbon-components-svelte/Select/Select.svelte";
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import StarRating from "carbon-components-svelte/StarRating/StarRating.svelte";
import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
import type { ComponentType } from "svelte";
import { tick } from "svelte";
import DatePickerField from "../form-field-contract/fixtures/DatePickerField.test.svelte";
import InlineEditField from "../form-field-contract/fixtures/InlineEditField.test.svelte";
import FieldsetHost from "./FieldsetHost.test.svelte";

const items = [
  { id: "a", text: "Alpha" },
  { id: "b", text: "Beta" },
];

/** Opens the list box from its chevron, the one part a disabled fieldset doesn't block. */
async function clickChevron(container: HTMLElement) {
  const chevron = container.querySelector(".bx--list-box__menu-icon");
  assert(chevron instanceof HTMLElement);
  await fireEvent.click(chevron);
}

// Each case renders the component in a fieldset that turns disabled after
// mount, then checks the part the browser leaves operable.
const cases: {
  name: string;
  component: ComponentType;
  fieldProps: Record<string, unknown>;
  expectDisabled: (container: HTMLElement) => Promise<void>;
}[] = [
  {
    name: "Slider",
    component: Slider,
    fieldProps: { labelText: "Field", value: 50 },
    expectDisabled: async () => {
      const thumb = screen.getByRole("slider");
      await fireEvent.keyDown(thumb, { key: "ArrowRight" });
      expect(thumb).toHaveAttribute("aria-valuenow", "50");
      expect(thumb).toHaveAttribute("aria-disabled", "true");
      expect(thumb).not.toHaveAttribute("tabindex");
    },
  },
  {
    name: "RangeSlider",
    component: RangeSlider,
    fieldProps: { labelText: "Field", value: 20, valueUpper: 80 },
    expectDisabled: async () => {
      const [lower] = screen.getAllByRole("slider");
      assert(lower);
      await fireEvent.keyDown(lower, { key: "ArrowRight" });
      expect(lower).toHaveAttribute("aria-valuenow", "20");
      expect(lower).not.toHaveAttribute("tabindex");
    },
  },
  {
    name: "NumberInput",
    component: NumberInput,
    fieldProps: { labelText: "Field", value: 5, scrubbable: true },
    expectDisabled: async () => {
      const label = screen.getByText("Field");
      await fireEvent.pointerDown(label, { clientX: 100, pointerId: 1 });
      await fireEvent.pointerMove(label, { clientX: 140, pointerId: 1 });
      await fireEvent.pointerUp(label, { clientX: 140, pointerId: 1 });
      expect(screen.getByRole("spinbutton")).toHaveValue(5);
      expect(label).toHaveClass("bx--label--disabled");
    },
  },
  ...[
    { name: "Dropdown", component: Dropdown },
    { name: "ComboBox", component: ComboBox },
    { name: "MultiSelect", component: MultiSelect },
  ].map(({ name, component }) => ({
    name,
    component,
    fieldProps: { labelText: "Field", items },
    expectDisabled: async (container: HTMLElement) => {
      await clickChevron(container);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(screen.getByText("Field")).toHaveClass("bx--label--disabled");
    },
  })),
];

describe("components in a disabled fieldset", () => {
  it.each(cases)(
    "$name follows the fieldset",
    async ({ component, fieldProps, expectDisabled }) => {
      const { container, rerender } = render(FieldsetHost, {
        props: { component, fieldProps },
      });

      await rerender({ disabled: true });
      await tick();

      await expectDisabled(container);
    },
  );
});

const field = { labelText: "Field", helperText: "Help" };
const group = { legendText: "Field", helperText: "Help" };

// The browser disables these fields' native controls itself; the fieldset
// now also reaches their disabled styles.
const styleCases: {
  name: string;
  component: ComponentType;
  fieldProps: Record<string, unknown>;
  marker: string;
}[] = [
  {
    name: "Checkbox",
    component: Checkbox,
    fieldProps: field,
    marker: ".bx--form__helper-text--disabled",
  },
  {
    name: "CheckboxGroup",
    component: CheckboxGroup,
    fieldProps: group,
    marker: ".bx--form__helper-text--disabled",
  },
  {
    name: "CopyInput",
    component: CopyInput,
    fieldProps: { ...field, value: "x" },
    marker: ".bx--label--disabled",
  },
  {
    name: "DatePickerInput",
    component: DatePickerField,
    fieldProps: field,
    marker: ".bx--label--disabled",
  },
  {
    name: "FileUploader",
    component: FileUploader,
    fieldProps: { labelTitle: "Field", labelDescription: "Help" },
    marker: ".bx--label-description--disabled",
  },
  {
    name: "FileUploaderButton",
    component: FileUploaderButton,
    fieldProps: field,
    marker: ".bx--btn--disabled",
  },
  {
    name: "FileUploaderDropContainer",
    component: FileUploaderDropContainer,
    fieldProps: field,
    marker: ".bx--file-browse-btn--disabled",
  },
  {
    name: "FormLabel",
    component: FormLabel,
    fieldProps: {},
    marker: ".bx--label--disabled",
  },
  {
    name: "InlineEdit",
    component: InlineEditField,
    fieldProps: { value: "x" },
    marker: ".bx--edit-in-place--disabled",
  },
  {
    name: "PinCodeInput",
    component: PinCodeInput,
    fieldProps: field,
    marker: ".bx--label--disabled",
  },
  {
    name: "RadioButtonGroup",
    component: RadioButtonGroup,
    fieldProps: group,
    marker: ".bx--form__helper-text--disabled",
  },
  {
    name: "Search",
    component: Search,
    fieldProps: field,
    marker: ".bx--search--disabled",
  },
  {
    name: "Select",
    component: Select,
    fieldProps: field,
    marker: ".bx--select--disabled",
  },
  {
    name: "StarRating",
    component: StarRating,
    fieldProps: group,
    marker: ".bx--star-rating--disabled",
  },
  {
    name: "OperationalTag",
    component: OperationalTag,
    fieldProps: { text: "Tag" },
    marker: ".bx--tag--disabled",
  },
  {
    name: "SelectableTag",
    component: SelectableTag,
    fieldProps: { text: "Tag" },
    marker: ".bx--tag--disabled",
  },
  {
    name: "TagInput",
    component: TagInput,
    fieldProps: field,
    marker: ".bx--tag-input--disabled",
  },
  {
    name: "TextArea",
    component: TextArea,
    fieldProps: field,
    marker: ".bx--label--disabled",
  },
  {
    name: "PasswordInput",
    component: PasswordInput,
    fieldProps: field,
    marker: ".bx--label--disabled",
  },
  {
    name: "TextInput",
    component: TextInput,
    fieldProps: field,
    marker: ".bx--label--disabled",
  },
  {
    name: "RadioTile",
    component: RadioTile,
    fieldProps: { value: "a", labelText: "Tile" },
    marker: ".bx--tile--disabled",
  },
  {
    name: "SelectableTile",
    component: SelectableTile,
    fieldProps: { labelText: "Tile" },
    marker: ".bx--tile--disabled",
  },
  {
    name: "TimePicker",
    component: TimePicker,
    fieldProps: field,
    marker: ".bx--label--disabled",
  },
  {
    name: "Toggle",
    component: Toggle,
    fieldProps: field,
    marker: ".bx--form__helper-text--disabled",
  },
];

describe("form fields in a disabled fieldset", () => {
  it.each(styleCases)(
    "$name shows its disabled state",
    async ({ component, fieldProps, marker }) => {
      const { container, rerender } = render(FieldsetHost, {
        props: { component, fieldProps },
      });
      expect(container.querySelector(marker)).toBeNull();

      await rerender({ disabled: true });
      await tick();

      expect(container.querySelector(marker)).not.toBeNull();
    },
  );
});
