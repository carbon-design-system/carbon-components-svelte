import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import NumberRangeInput from "./NumberRangeInput.test.svelte";

const minInput = () => screen.getByRole("spinbutton", { name: /^Minimum/ });
const maxInput = () => screen.getByRole("spinbutton", { name: /^Maximum/ });
const paste = (input: HTMLElement, text: string) =>
  fireEvent.paste(input, { clipboardData: { getData: () => text } });

describe("NumberRangeInput", () => {
  describe("structure", () => {
    it("is a group named by its legend, with a labeled field for each end", () => {
      render(NumberRangeInput);

      const group = screen.getByRole("group", { name: "Price" });
      expect(within(group).getAllByRole("spinbutton")).toHaveLength(2);
      expect(minInput()).toHaveAccessibleName("Minimum Price");
      expect(maxInput()).toHaveAccessibleName("Maximum Price");
    });

    it("hides the separator from assistive technology", () => {
      render(NumberRangeInput, { props: { separator: "to" } });

      expect(screen.getByText("to")).toHaveAttribute("aria-hidden", "true");
    });

    it("takes its field labels from minLabelText and maxLabelText", () => {
      render(NumberRangeInput, {
        props: { minLabelText: "From", maxLabelText: "Up to" },
      });

      expect(
        screen.getByRole("spinbutton", { name: "From Price" }),
      ).toBeVisible();
      expect(
        screen.getByRole("spinbutton", { name: "Up to Price" }),
      ).toBeVisible();
    });

    it("can hide the field labels visually and keep their names", () => {
      render(NumberRangeInput, { props: { hideInputLabels: true } });

      expect(screen.getByText("Minimum")).toHaveClass("bx--visually-hidden");
      expect(minInput()).toHaveAccessibleName("Minimum Price");
    });

    it("shows the bounds as placeholders for an open end", () => {
      render(NumberRangeInput, { props: { min: 0, max: 1000 } });

      expect(minInput()).toHaveAttribute("placeholder", "0");
      expect(maxInput()).toHaveAttribute("placeholder", "1000");
    });

    it("hides the steppers unless asked to show them", () => {
      const { unmount } = render(NumberRangeInput);
      expect(screen.queryByTitle("Increment number")).toBeNull();
      unmount();

      render(NumberRangeInput, { props: { hideSteppers: false } });
      expect(screen.getAllByTitle("Increment number")).toHaveLength(2);
    });

    it("disables both fields with the fieldset", () => {
      render(NumberRangeInput, { props: { disabled: true } });

      expect(minInput()).toBeDisabled();
      expect(maxInput()).toBeDisabled();
    });
  });

  describe("value", () => {
    it("shows the ends of a range and leaves a null end empty", () => {
      render(NumberRangeInput, { props: { value: [10, null] } });

      expect(minInput()).toHaveValue(10);
      expect(maxInput()).toHaveValue(null);
    });

    it("follows typing into either field", async () => {
      const onInput = vi.fn();
      const { component } = render(NumberRangeInput, { props: { onInput } });

      await user.type(minInput(), "10");
      await user.type(maxInput(), "250");

      expect(onInput).toHaveBeenLastCalledWith({
        value: [10, 250],
        valid: true,
      });
      expect(component.value).toEqual([10, 250]);
    });

    it("makes an emptied field an open end", async () => {
      const { component } = render(NumberRangeInput, {
        props: { value: [10, 250] },
      });

      await user.clear(maxInput());
      await user.tab();

      expect(component.value).toEqual([10, null]);
    });

    it("follows a value set from outside", async () => {
      const { rerender } = render(NumberRangeInput, {
        props: { value: [1, 2] },
      });

      await rerender({ value: [5, 9] });

      expect(minInput()).toHaveValue(5);
      expect(maxInput()).toHaveValue(9);
    });

    it("dispatches change once a field is left, with the validity", async () => {
      const onChange = vi.fn();
      render(NumberRangeInput, { props: { onChange } });

      await user.type(minInput(), "10");
      expect(onChange).not.toHaveBeenCalled();
      await user.tab();

      expect(onChange).toHaveBeenCalledWith({ value: [10, null], valid: true });
    });

    it("submits each end under its own name", () => {
      const { container } = render(NumberRangeInput, {
        props: { value: [10, 250], name: "price", nameUpper: "price-max" },
      });

      const data = new FormData();
      for (const input of container.querySelectorAll("input[name]")) {
        data.append(
          input.getAttribute("name") as string,
          (input as HTMLInputElement).value,
        );
      }
      expect(Object.fromEntries(data)).toEqual({
        price: "10",
        "price-max": "250",
      });
    });
  });

  describe("min above max", () => {
    it("is an error on the field edited last, and leaves the value alone", async () => {
      const { component } = render(NumberRangeInput, {
        props: { value: [10, null] },
      });

      await user.type(maxInput(), "5");
      await user.tab();

      expect(maxInput()).toHaveAttribute("aria-invalid", "true");
      expect(minInput()).not.toHaveAttribute("aria-invalid");
      expect(maxInput()).toHaveAccessibleErrorMessage(
        "Must not be below the minimum, 10.",
      );
      expect(component.value).toEqual([10, 5]);
      expect(component.valid).toBe(false);
    });

    it("puts the error on the minimum when the minimum was edited last", async () => {
      render(NumberRangeInput, { props: { value: [null, 100] } });

      await user.type(minInput(), "300");
      await user.tab();

      expect(minInput()).toHaveAccessibleErrorMessage(
        "Must not be above the maximum, 100.",
      );
      expect(maxInput()).not.toHaveAttribute("aria-invalid");
    });

    it("waits for the field to be left before it speaks, then clears as soon as fixed", async () => {
      const { component } = render(NumberRangeInput, {
        props: { value: [10, null] },
      });

      await user.type(maxInput(), "5");
      expect(screen.queryByText(/Must not be below/)).toBeNull();
      await user.tab();
      expect(screen.getByText(/Must not be below/)).toBeVisible();

      // Raise the maximum: the error goes without waiting for the blur.
      await user.type(maxInput(), "0");
      expect(screen.queryByText(/Must not be below/)).toBeNull();
      expect(component.valid).toBe(true);
    });

    it("clears from the other field when it fixes the pair", async () => {
      render(NumberRangeInput, { props: { value: [10, null] } });

      await user.type(maxInput(), "5");
      await user.tab();
      expect(maxInput()).toHaveAttribute("aria-invalid", "true");

      await user.clear(minInput());
      await user.type(minInput(), "2");

      expect(maxInput()).not.toHaveAttribute("aria-invalid");
    });

    it("shows a crossed value set from outside on the maximum", () => {
      render(NumberRangeInput, { props: { value: [300, 250] } });

      expect(maxInput()).toHaveAttribute("aria-invalid", "true");
      expect(minInput()).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("bounds, step and open ends", () => {
    it("names the bound a value is outside of, in the locale's format", async () => {
      render(NumberRangeInput, {
        props: { min: 0, max: 1500, locale: "en-US" },
      });

      await user.type(
        screen.getByRole("textbox", { name: /^Maximum/ }),
        "2000",
      );
      await user.tab();

      expect(
        screen.getByRole("textbox", { name: /^Maximum/ }),
      ).toHaveAccessibleErrorMessage("Enter 1,500 or less.");
    });

    it("rejects a value between steps, counted from min", async () => {
      render(NumberRangeInput, { props: { min: 5, step: 5 } });

      await user.type(minInput(), "12");
      await user.tab();

      expect(minInput()).toHaveAccessibleErrorMessage(
        "Use whole steps, such as 10.",
      );
    });

    it("requires both ends when allowOpen is false, once a field is left", async () => {
      const { component } = render(NumberRangeInput, {
        props: { allowOpen: false },
      });
      expect(screen.queryByText("Enter a minimum.")).toBeNull();

      await user.click(minInput());
      await user.tab();

      expect(minInput()).toHaveAccessibleErrorMessage("Enter a minimum.");
      expect(maxInput()).not.toHaveAttribute("aria-invalid");
      expect(component.valid).toBe(false);
    });

    it("lets translateWithId reword a message", async () => {
      render(NumberRangeInput, {
        props: {
          max: 10,
          translateWithId: (id: string, { limit }: { limit: string }) =>
            `${id}:${limit}`,
        },
      });

      await user.type(maxInput(), "11");
      await user.tab();

      expect(maxInput()).toHaveAccessibleErrorMessage("aboveMax:10");
    });
  });

  describe("pasting a range", () => {
    it.each([
      ["10-250", [10, 250]],
      ["10 – 250", [10, 250]],
      ["10 to 250", [10, 250]],
      ["8000..8100", [8000, 8100]],
    ])("splits %j across both fields", async (text, expected) => {
      const { component } = render(NumberRangeInput);

      await paste(minInput(), text);

      expect(component.value).toEqual(expected);
      expect(minInput()).toHaveValue(expected[0]);
      expect(maxInput()).toHaveValue(expected[1]);
    });

    it("splits a range pasted into the maximum too", async () => {
      const { component } = render(NumberRangeInput);

      await paste(maxInput(), "10-250");

      expect(component.value).toEqual([10, 250]);
    });

    it("reports a crossed paste on the field it went into", async () => {
      render(NumberRangeInput);

      await paste(minInput(), "250-10");

      expect(minInput()).toHaveAttribute("aria-invalid", "true");
      expect(maxInput()).not.toHaveAttribute("aria-invalid");
    });

    it("reads the numbers in the locale's format", async () => {
      const { component } = render(NumberRangeInput, {
        props: { locale: "de-DE" },
      });

      await paste(
        screen.getByRole("textbox", { name: /^Minimum/ }),
        "1.234,5 – 2.000",
      );

      expect(component.value).toEqual([1234.5, 2000]);
    });

    it("leaves a single number to the field's own paste", async () => {
      const { component } = render(NumberRangeInput);

      // The event is not cancelled, so the browser inserts the text.
      expect(await paste(minInput(), "42")).toBe(true);
      expect(component.value).toEqual([null, null]);
    });

    it("does not split into a read-only range", async () => {
      const { component } = render(NumberRangeInput, {
        props: { readonly: true },
      });

      expect(
        await paste(
          screen.getByRole("textbox", { name: /^Minimum/ }),
          "10-250",
        ),
      ).toBe(true);
      expect(component.value).toEqual([null, null]);
    });
  });

  describe("range-wide state", () => {
    it("marks both fields and describes the group with one message", () => {
      render(NumberRangeInput, {
        props: { invalid: true, invalidText: "No results in this range." },
      });

      const message = screen.getByText("No results in this range.");
      expect(message).toHaveAttribute("role", "alert");
      for (const input of [minInput(), maxInput()]) {
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(input).toHaveAccessibleErrorMessage("No results in this range.");
      }
    });

    it("gives a field its own message over the range's", async () => {
      render(NumberRangeInput, {
        props: {
          value: [10, null],
          invalid: true,
          invalidText: "No results in this range.",
        },
      });

      await user.type(maxInput(), "5");
      await user.tab();

      expect(maxInput()).toHaveAccessibleErrorMessage(
        "Must not be below the minimum, 10.",
      );
      expect(minInput()).toHaveAccessibleErrorMessage(
        "No results in this range.",
      );
    });
  });

  describe("slider", () => {
    it("is off unless asked for, and needs both bounds", () => {
      const { unmount } = render(NumberRangeInput, {
        props: { min: 0, max: 100 },
      });
      expect(screen.queryByRole("slider")).toBeNull();
      unmount();

      render(NumberRangeInput, { props: { slider: true } });
      expect(screen.queryByRole("slider")).toBeNull();
    });

    it("rests an open end's handle at its bound", () => {
      render(NumberRangeInput, {
        props: { slider: true, min: 0, max: 100, value: [null, 60] },
      });

      const [lower, upper] = screen.getAllByRole("slider");
      expect(lower).toHaveAttribute("aria-valuenow", "0");
      expect(upper).toHaveAttribute("aria-valuenow", "60");
    });

    it("names its handles and reads them in the field's format", () => {
      render(NumberRangeInput, {
        props: {
          slider: true,
          min: 0,
          max: 1000,
          value: [10, 250],
          locale: "en-US",
          formatOptions: { style: "currency", currency: "USD" },
        },
      });

      const [lower, upper] = screen.getAllByRole("slider");
      expect(lower).toHaveAccessibleName("Price Minimum");
      expect(lower).toHaveAttribute("aria-valuetext", "$10.00");
      expect(upper).toHaveAccessibleName("Price Maximum");
      expect(upper).toHaveAttribute("aria-valuetext", "$250.00");
    });

    it("moves a field when a handle moves, and keeps the other end open", async () => {
      const { component } = render(NumberRangeInput, {
        props: { slider: true, min: 0, max: 100, step: 1 },
      });

      const [, upper] = screen.getAllByRole("slider");
      upper.focus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}");

      expect(component.value).toEqual([null, 98]);
      expect(maxInput()).toHaveValue(98);
      expect(minInput()).toHaveValue(null);
    });

    it("moves a handle when a field changes", async () => {
      render(NumberRangeInput, {
        props: { slider: true, min: 0, max: 100 },
      });

      await user.type(minInput(), "30");
      await user.type(maxInput(), "70");

      const [lower, upper] = screen.getAllByRole("slider");
      expect(lower).toHaveAttribute("aria-valuenow", "30");
      expect(upper).toHaveAttribute("aria-valuenow", "70");
    });

    it("tabs from the fields to the handles, in order", async () => {
      render(NumberRangeInput, {
        props: { slider: true, min: 0, max: 100 },
      });

      await user.click(minInput());
      await user.tab();
      expect(maxInput()).toHaveFocus();
      await user.tab();
      const [lower, upper] = screen.getAllByRole("slider");
      expect(lower).toHaveFocus();
      await user.tab();
      expect(upper).toHaveFocus();
    });
  });
});
