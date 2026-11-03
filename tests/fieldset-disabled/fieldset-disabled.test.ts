import { fireEvent, render, screen } from "@testing-library/svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import type { ComponentType } from "svelte";
import { tick } from "svelte";
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
  ...[{ name: "Dropdown", component: Dropdown }].map(({ name, component }) => ({
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
