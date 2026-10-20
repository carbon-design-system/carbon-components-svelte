import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { clickToFocus } from "../utils/click-to-focus";
import { user } from "../utils/user";
import TimePickerFluidSkeleton from "./TimePicker.fluidSkeleton.test.svelte";
import TimePickerFluidSlot from "./TimePicker.fluidSlot.test.svelte";
import TimePickerSkeleton from "./TimePicker.skeleton.test.svelte";
import TimePicker from "./TimePicker.test.svelte";
import TimePickerCustom from "./TimePickerCustom.test.svelte";
import TimePickerSelectDefault from "./TimePickerSelect.default.test.svelte";
import TimePickerSelectNumeric from "./TimePickerSelect.numeric.test.svelte";
import TimePickerSelectSlot from "./TimePickerSelect.slot.test.svelte";
import TimePickerSelectEvents from "./TimePickerSelectEvents.test.svelte";

describe("TimePicker", () => {
  it("should render with default props", () => {
    render(TimePicker);

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "test-time");
    expect(input).toHaveAttribute("placeholder", "hh:mm");
    expect(input).toHaveAttribute("pattern", "(1[012]|[1-9]):[0-5][0-9](\\s)?");
    expect(input).toHaveAttribute("maxlength", "5");
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("PDT")).toBeInTheDocument();
    expect(screen.getByText("GMT")).toBeInTheDocument();
  });

  it("keeps the selected value through the click's mouseup when fluid", async () => {
    render(TimePicker, {
      props: { selectTextOnFocus: true, value: "12:00", fluid: true },
    });

    const mouseup = await clickToFocus(screen.getByRole("textbox"));
    expect(mouseup.defaultPrevented).toBe(true);
  });

  it("should handle different sizes", () => {
    const sizes = ["xs", "sm", "xl"] as const;
    for (const size of sizes) {
      const { container } = render(TimePicker, {
        props: { size },
      });

      expect(container.querySelector(".bx--time-picker")).toHaveClass(
        `bx--time-picker--${size}`,
      );
      container.remove();
    }
  });

  it("should handle disabled state", () => {
    render(TimePicker, { props: { disabled: true } });

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(screen.getByText("Time")).toHaveClass("bx--label--disabled");
  });

  it("should handle readonly state", () => {
    const { container } = render(TimePicker, { props: { readonly: true } });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readonly");
    expect(container.querySelector(".bx--time-picker")).toHaveClass(
      "bx--time-picker--readonly",
    );
    expect(screen.getByText("Time")).toHaveClass("bx--label--readonly");
  });

  it("should not change value when readonly", async () => {
    render(TimePicker, { props: { readonly: true, value: "10:30" } });

    const input = screen.getByRole("textbox");
    await user.type(input, "11:45");
    expect(input).toHaveValue("10:30");
  });

  it("should handle invalid state", () => {
    render(TimePicker, {
      props: {
        id: "time-input",
        invalid: true,
        invalidText: "Invalid time",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).toHaveAttribute("data-invalid");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-errormessage", "error-time-input");
    expect(input).not.toHaveAttribute("aria-describedby");
    const errorText = screen.getByText("Invalid time");
    expect(errorText).toHaveClass("bx--form-requirement");
    expect(errorText).toHaveAttribute("id", "error-time-input");
    expect(errorText).toHaveAttribute("role", "alert");
  });

  it("should not set aria-describedby when valid", () => {
    render(TimePicker);

    const input = screen.getByRole("textbox");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("should handle warn state", () => {
    render(TimePicker, {
      props: { warn: true, warnText: "Time may be unusual" },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--warning");
    expect(input).not.toHaveClass("bx--text-input--invalid");
    expect(screen.getByText("Time may be unusual")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should prefer invalid over warn when both are set", () => {
    render(TimePicker, {
      props: {
        invalid: true,
        invalidText: "Invalid time",
        warn: true,
        warnText: "Time may be unusual",
      },
    });

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("bx--text-input--invalid");
    expect(input).not.toHaveClass("bx--text-input--warning");
    expect(screen.getByText("Invalid time")).toBeInTheDocument();
    expect(screen.queryByText("Time may be unusual")).not.toBeInTheDocument();
  });

  it("should handle custom id", () => {
    render(TimePicker, { props: { id: "custom-id" } });

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(screen.getByText("Time")).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(TimePicker, { props: { name: "custom-name" } });

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom placeholder", () => {
    render(TimePicker, { props: { placeholder: "Enter time" } });

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Enter time",
    );
  });

  it("should handle custom pattern", () => {
    render(TimePicker, { props: { pattern: "custom-pattern" } });

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "pattern",
      "custom-pattern",
    );
  });

  it("should handle custom maxlength", () => {
    render(TimePicker, { props: { maxlength: 10 } });

    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "10");
  });

  it("should handle change event", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    const onKeydown = vi.fn();
    render(TimePicker, { onChange, onInput, onKeydown });

    const input = screen.getByRole("textbox");
    await user.type(input, "10:30");
    expect(onInput).toHaveBeenCalledTimes(5);
    expect(onKeydown).toHaveBeenCalledTimes(5);
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard("{Tab}");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("should handle focus and blur events", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(TimePicker, { onFocus, onBlur });

    const input = screen.getByRole("textbox");
    await user.tab();
    expect(input).toHaveFocus();
    expect(onFocus).toHaveBeenCalledOnce();

    await user.tab();
    expect(input).not.toHaveFocus();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("should handle disabled state with events", async () => {
    render(TimePicker, { props: { disabled: true } });

    const input = screen.getByRole("textbox");
    await user.type(input, "10:30");
    expect(input).toHaveValue("");
  });

  it("should render helper text", () => {
    render(TimePicker, {
      props: { id: "test-id", helperText: "24-hour, e.g. 14:30" },
    });

    const helper = screen.getByText("24-hour, e.g. 14:30");
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveClass("bx--form__helper-text");
    expect(helper).toHaveAttribute("id", "helper-test-id");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "helper-test-id",
    );
  });

  it("should apply disabled class to helper text when disabled", () => {
    render(TimePicker, {
      props: { helperText: "24-hour, e.g. 14:30", disabled: true },
    });

    expect(screen.getByText("24-hour, e.g. 14:30")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it.each([{ disabled: true }, { readonly: true }])(
    "suppresses invalid and warn states when %o",
    (props) => {
      render(TimePicker, {
        props: {
          invalid: true,
          invalidText: "Invalid time",
          warn: true,
          warnText: "Warning message",
          ...props,
        },
      });

      const input = screen.getByRole("textbox");
      expect(input).not.toHaveClass("bx--text-input--invalid");
      expect(input).not.toHaveClass("bx--text-input--warning");
      expect(input).not.toHaveAttribute("data-invalid");
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(screen.queryByText("Invalid time")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
      expect(document.querySelector(".bx--time-picker--invalid")).toBeNull();
      expect(document.querySelector(".bx--time-picker--warn")).toBeNull();
    },
  );

  it("renders the invalid icon when invalid", () => {
    const { container } = render(TimePicker, {
      props: { invalid: true, invalidText: "Invalid time" },
    });

    expect(
      container.querySelector(".bx--text-input__invalid-icon"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".bx--text-input__invalid-icon--warning"),
    ).toBeNull();
  });

  it("renders the warning icon when warn is set", () => {
    const { container } = render(TimePicker, {
      props: { warn: true, warnText: "Warning message" },
    });

    expect(
      container.querySelector(".bx--text-input__invalid-icon--warning"),
    ).toBeInTheDocument();
  });

  it("should handle label text slot", () => {
    render(TimePickerCustom);

    const label = screen.getByText("Custom Label Text");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("SPAN");
  });

  it("should handle TimePickerSelect components", () => {
    render(TimePicker);

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue("pm");
    expect(selects[1]).toHaveValue("pdt");
  });

  it("supports custom label slot for TimePickerSelect", () => {
    render(TimePickerSelectSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should support readonly on TimePickerSelect", async () => {
    render(TimePickerCustom, { props: { selectReadonly: true } });

    const selects = screen.getAllByRole("combobox");
    for (const select of selects) {
      expect(select).toHaveAttribute("aria-readonly", "true");
      expect(select.closest(".bx--time-picker__select")).toHaveClass(
        "bx--select--readonly",
      );
    }

    const [select] = selects;
    expect(await fireEvent.keyDown(select, { key: "ArrowDown" })).toBe(false);
  });

  it("prevents mousedown on a read-only TimePickerSelect", async () => {
    render(TimePickerCustom, { props: { selectReadonly: true } });

    const [select] = screen.getAllByRole("combobox");
    expect(await fireEvent.mouseDown(select)).toBe(false);
    expect(select).toHaveFocus();
  });

  it("allows mousedown on an editable TimePickerSelect", async () => {
    render(TimePicker);

    const [select] = screen.getAllByRole("combobox");
    expect(await fireEvent.mouseDown(select)).toBe(true);
  });

  it("describes a read-only TimePickerSelect for screen readers that ignore aria-readonly", () => {
    render(TimePickerCustom, {
      props: { selectReadonly: true, id: "test-time-picker-select" },
    });

    const [select] = screen.getAllByRole("combobox");
    expect(select).toHaveAttribute(
      "aria-describedby",
      "readonly-test-time-picker-select",
    );

    const description = document.getElementById(
      "readonly-test-time-picker-select",
    );
    expect(description).toHaveTextContent("Read-only");
    expect(description).toHaveClass("bx--visually-hidden");
  });

  it("supports overriding a TimePickerSelect's read-only assistive text", () => {
    render(TimePickerCustom, {
      props: {
        selectReadonly: true,
        id: "test-time-picker-select",
        readonlyText: "Custom text",
      },
    });

    expect(screen.getByText("Custom text")).toBeInTheDocument();
  });

  it("does not set aria-describedby on an editable TimePickerSelect", () => {
    render(TimePickerCustom, {
      props: { id: "test-time-picker-select" },
    });

    const [select] = screen.getAllByRole("combobox");
    expect(select).not.toHaveAttribute("aria-describedby");
    expect(
      document.getElementById("readonly-test-time-picker-select"),
    ).toBeNull();
  });

  describe("inherited readonly and disabled", () => {
    it.each([{ fluid: false }, { fluid: true }])(
      "makes the selects read-only with the time picker (%o)",
      ({ fluid }) => {
        render(TimePicker, { props: { readonly: true, fluid } });

        for (const select of screen.getAllByRole("combobox")) {
          expect(select).toHaveAttribute("aria-readonly", "true");
          expect(select.closest(".bx--time-picker__select")).toHaveClass(
            "bx--select--readonly",
          );
          const describedBy = select.getAttribute("aria-describedby");
          assert(describedBy);
          expect(document.getElementById(describedBy)).toHaveTextContent(
            "Read-only",
          );
        }
      },
    );

    it("blocks keyboard changes on an inherited read-only select", async () => {
      render(TimePicker, { props: { readonly: true } });

      const [select] = screen.getAllByRole("combobox");
      expect(await fireEvent.keyDown(select, { key: "ArrowDown" })).toBe(false);
    });

    it("applies readonly toggled after mount to the selects", async () => {
      const { rerender } = render(TimePicker, { props: { readonly: false } });

      await rerender({ readonly: true });
      for (const select of screen.getAllByRole("combobox")) {
        expect(select).toHaveAttribute("aria-readonly", "true");
      }

      await rerender({ readonly: false });
      for (const select of screen.getAllByRole("combobox")) {
        expect(select).not.toHaveAttribute("aria-readonly");
      }
    });

    it("applies disabled toggled after mount to the selects", async () => {
      const { rerender } = render(TimePicker, { props: { disabled: false } });

      await rerender({ disabled: true });
      for (const select of screen.getAllByRole("combobox")) {
        expect(select).toBeDisabled();
      }

      await rerender({ disabled: false });
      for (const select of screen.getAllByRole("combobox")) {
        expect(select).toBeEnabled();
      }
    });

    it("leaves the selects editable and enabled by default", () => {
      render(TimePicker);

      for (const select of screen.getAllByRole("combobox")) {
        expect(select).not.toHaveAttribute("aria-readonly");
        expect(select).toBeEnabled();
      }
    });

    it("leaves a standalone select editable and enabled", () => {
      render(TimePickerSelectEvents);

      const select = screen.getByRole("combobox");
      expect(select).not.toHaveAttribute("aria-readonly");
      expect(select).toBeEnabled();
    });

    it("disables the selects with the time picker", () => {
      render(TimePicker, { props: { disabled: true } });

      for (const select of screen.getAllByRole("combobox")) {
        expect(select).toBeDisabled();
      }
    });

    it("disables the fluid select cells with the time picker", () => {
      render(TimePicker, { props: { disabled: true, fluid: true } });

      for (const select of screen.getAllByRole("combobox")) {
        expect(select).toBeDisabled();
        expect(select.closest(".bx--time-picker__select")).toHaveClass(
          "bx--select--disabled",
        );
      }
    });
  });

  it("keeps a read-only select closed on Alt+Down", async () => {
    render(TimePickerCustom, { props: { selectReadonly: true } });

    const [select] = screen.getAllByRole("combobox");
    expect(
      await fireEvent.keyDown(select, { key: "ArrowDown", altKey: true }),
    ).toBe(false);
    expect(await fireEvent.keyDown(select, { key: "Tab" })).toBe(true);
    expect(
      await fireEvent.keyDown(select, { key: "Tab", shiftKey: true }),
    ).toBe(true);
  });

  it.each([
    { key: "c", ctrlKey: true },
    { key: "r", metaKey: true },
  ])("lets %o through on a read-only select", async (init) => {
    render(TimePickerCustom, { props: { selectReadonly: true } });

    const [select] = screen.getAllByRole("combobox");
    expect(await fireEvent.keyDown(select, init)).toBe(true);
  });

  it("does not block Alt+Down when the select is not read-only", async () => {
    render(TimePickerCustom);

    const [select] = screen.getAllByRole("combobox");
    expect(
      await fireEvent.keyDown(select, { key: "ArrowDown", altKey: true }),
    ).toBe(true);
  });

  describe("fluid variant", () => {
    it("renders fluid select cells", () => {
      render(TimePicker, { fluid: true });

      expect(document.querySelectorAll(".bx--select--fluid")).toHaveLength(2);
    });

    it("does not render an icon when neither invalid nor warn", () => {
      render(TimePicker, { fluid: true });

      expect(
        document.querySelector(".bx--time-picker__icon--invalid"),
      ).toBeNull();
      expect(document.querySelector(".bx--time-picker__icon--warn")).toBeNull();
    });

    it("marks labels as slotted when fluid", () => {
      render(TimePickerFluidSlot);

      expect(screen.getByText("Time")).toHaveClass("bx--label--slotted");
      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });
  });

  it("forwards select events from TimePickerSelect", async () => {
    const selectChange = vi.fn();
    const selectInput = vi.fn();
    const selectFocus = vi.fn();
    const selectBlur = vi.fn();

    render(TimePickerSelectEvents, {
      props: {
        selectChange,
        selectInput,
        selectFocus,
        selectBlur,
      },
    });

    const select = screen.getByRole("combobox");

    select.focus();
    expect(selectFocus).toHaveBeenCalled();

    await user.selectOptions(select, "pm");
    expect(selectChange).toHaveBeenCalled();
    expect(selectInput).toHaveBeenCalled();

    select.blur();
    expect(selectBlur).toHaveBeenCalled();
  });

  it("keeps numeric select values numeric after a change", async () => {
    render(TimePickerSelectNumeric);

    const select = screen.getByRole("combobox");
    assert(select instanceof HTMLSelectElement);
    const bound = screen.getByTestId("bound");

    await user.selectOptions(select, "-7");
    expect(select.selectedIndex).toBe(1);
    expect(bound).toHaveTextContent(/^-7$/);

    await user.selectOptions(select, "0");
    expect(select.selectedIndex).toBe(0);
    expect(bound).toHaveTextContent(/^0$/);
  });

  describe("TimePickerSelect default value", () => {
    const setup = async (props = {}) => {
      render(TimePickerSelectDefault, { props });
      await tick();
      const select = screen.getByRole("combobox");
      assert(select instanceof HTMLSelectElement);
      return {
        select,
        bound: screen.getByTestId("bound"),
      };
    };

    it("selects the first item when there is no value", async () => {
      const { select, bound } = await setup();

      expect(select.selectedIndex).toBe(0);
      expect(bound).toHaveTextContent(/^"am"$/);
    });

    it("keeps an explicit value", async () => {
      const { select, bound } = await setup({ value: "pm" });

      expect(select.selectedIndex).toBe(1);
      expect(bound).toHaveTextContent(/^"pm"$/);
    });

    it('keeps "" when an item has the value ""', async () => {
      const { select, bound } = await setup({
        items: [
          { value: "am", text: "AM" },
          { value: "", text: "None" },
        ],
      });

      expect(select.selectedIndex).toBe(1);
      expect(bound).toHaveTextContent(/^""$/);
    });

    it("adopts a numeric first item as a number", async () => {
      const { select, bound } = await setup({
        items: [
          { value: 0, text: "UTC" },
          { value: -7, text: "PDT" },
        ],
      });

      expect(select.selectedIndex).toBe(0);
      expect(bound).toHaveTextContent(/^0$/);
    });
  });

  it("renders skeleton state", () => {
    render(TimePickerSkeleton);

    const skeleton = screen.getByTestId("time-picker-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--time-picker");
    expect(skeleton.children).toHaveLength(3);

    const [inputWrapper, firstSelect, secondSelect] = skeleton.children;
    expect(inputWrapper).toHaveClass("bx--time-picker__input");
    expect(
      inputWrapper.querySelector(".bx--skeleton.bx--text-input"),
    ).toBeTruthy();
    expect(firstSelect).toHaveClass("bx--time-picker__select");
    expect(firstSelect.querySelector(".bx--skeleton.bx--select")).toBeTruthy();
    expect(secondSelect).toHaveClass("bx--time-picker__select");
    expect(secondSelect.querySelector(".bx--skeleton.bx--select")).toBeTruthy();
  });

  it("passes the skeleton size to the input and selects", () => {
    render(TimePickerSkeleton, { props: { size: "xs" } });

    const skeleton = screen.getByTestId("time-picker-skeleton");
    expect(skeleton.querySelector(".bx--text-input")).toHaveClass(
      "bx--text-input--xs",
    );
    const selects = skeleton.querySelectorAll(".bx--select");
    expect(selects).toHaveLength(2);
    for (const select of selects) {
      expect(select).toHaveClass("bx--select--xs");
    }
  });

  it("renders fluid skeleton state", () => {
    render(TimePickerFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-time-picker-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--time-picker--fluid--skeleton");
    expect(skeleton).not.toHaveClass("bx--time-picker--equal-width");
    expect(skeleton.children).toHaveLength(3);
    expect(skeleton.children[0]).toHaveClass("bx--text-input--fluid__skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--select--fluid__skeleton");
    expect(skeleton.children[2]).toHaveClass("bx--select--fluid__skeleton");
  });

  it("renders only two elements when isOnlyTwo", () => {
    render(TimePickerFluidSkeleton, { props: { isOnlyTwo: true } });

    const skeleton = screen.getByTestId("fluid-time-picker-skeleton");
    expect(skeleton).toHaveClass(
      "bx--time-picker--fluid--skeleton",
      "bx--time-picker--equal-width",
    );
    expect(skeleton.children).toHaveLength(2);
    expect(skeleton.children[0]).toHaveClass("bx--text-input--fluid__skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--select--fluid__skeleton");
  });
});
