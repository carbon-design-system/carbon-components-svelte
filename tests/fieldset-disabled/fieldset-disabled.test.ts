import { fireEvent, render, screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
import Search from "carbon-components-svelte/Search/Search.svelte";
import Select from "carbon-components-svelte/Select/Select.svelte";
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import type { ComponentType } from "svelte";
import { tick } from "svelte";
import DatePickerField from "../form-field-contract/fixtures/DatePickerField.test.svelte";
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

// The browser disables these fields' native controls itself; the fieldset
// now also reaches their disabled styles.
const styleCases: {
  name: string;
  component: ComponentType;
  fieldProps: Record<string, unknown>;
  marker: string;
}[] = [
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
