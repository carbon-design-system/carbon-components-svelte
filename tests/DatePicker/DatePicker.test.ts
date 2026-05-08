import { render, screen } from "@testing-library/svelte";
import { DatePickerSkeleton } from "carbon-components-svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import { tick } from "svelte";
import { user } from "../setup-tests";
import DatePicker from "./DatePicker.test.svelte";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";
import DatePickerInModal from "./DatePickerInModal.test.svelte";
import DatePickerInputSlot from "./DatePickerInput.slot.test.svelte";
import DatePickerRange from "./DatePickerRange.test.svelte";

describe("DatePicker", () => {
  it("renders with default props", async () => {
    render(DatePicker);

    const input = screen.getByLabelText("Date");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    await user.type(input, "01/01/2023");
    expect(input).toHaveValue("01/01/2023");
  });

  it("renders light variant", () => {
    const { container } = render(DatePicker, { light: true });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--light");
  });

  it("renders short variant", () => {
    const { container } = render(DatePicker, { short: true });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--short");
  });

  it("renders single mode", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--single");

    expect(
      screen.queryByLabelText("calendar-container"),
    ).not.toBeInTheDocument();
    await user.click(input);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
  });

  it("renders single-letter weekday shorthands for locale='en'", async () => {
    const { container } = render(DatePicker, { datePickerType: "single" });

    await user.click(screen.getByLabelText("Date"));
    await screen.findByLabelText("calendar-container");

    const weekdays = Array.from(
      container.querySelectorAll(".flatpickr-weekday"),
    ).map((node) => node.textContent?.trim());

    expect(weekdays).toEqual(["S", "M", "T", "W", "Th", "F", "S"]);
  });

  it("renders range mode", async () => {
    const { container } = render(DatePickerRange);

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    expect(inputStart).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(inputEnd).toHaveAttribute("placeholder", "mm/dd/yyyy");

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--range");

    expect(
      screen.queryByLabelText("calendar-container"),
    ).not.toBeInTheDocument();
    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(DatePicker, { disabled: true });
    const input = screen.getByPlaceholderText("mm/dd/yyyy");
    expect(input).toBeDisabled();
  });

  describe("readonly", () => {
    it("forwards the readonly attribute and marks the label", () => {
      render(DatePicker, { readonly: true });
      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("readonly");
      expect(screen.getByText("Date")).toHaveClass("bx--label--readonly");
    });

    it("prevents typing into the input when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date") as HTMLInputElement;
      await user.type(input, "01/15/2024");
      expect(input.value).toBe("");
    });

    it("does not open the calendar on click in single mode when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      await user.click(input);
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).not.toHaveClass("open");
    });

    it("does not open the calendar on ArrowDown when readonly", async () => {
      render(DatePicker, { datePickerType: "single", readonly: true });
      const input = screen.getByLabelText("Date");
      input.focus();
      await user.keyboard("{ArrowDown}");
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).not.toHaveClass("open");
    });

    it("forwards the readonly attribute to both inputs in range mode", async () => {
      render(DatePickerRange, { readonly: true });
      // Wait for flatpickr (including the range plugin's onReady) to finish.
      await screen.findByLabelText("calendar-container");
      const start = screen.getByLabelText("Start date");
      const end = screen.getByLabelText("End date");
      expect(start).toHaveAttribute("readonly");
      expect(end).toHaveAttribute("readonly");
    });
  });

  it("handles invalid state", () => {
    const { container } = render(DatePicker, {
      invalid: true,
      invalidText: "Invalid date",
    });
    expect(screen.getByText("Invalid date")).toBeInTheDocument();
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--invalid");
  });

  it("handles warning state", () => {
    const { container } = render(DatePicker, {
      warn: true,
      warnText: "Warning message",
    });
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    const wrapper = container.querySelector(".bx--date-picker-input__wrapper");
    expect(wrapper).toHaveClass("bx--date-picker-input__wrapper--warn");
  });

  it("handles helper text", () => {
    render(DatePicker, { helperText: "Helper message" });
    expect(screen.getByText("Helper message")).toBeInTheDocument();
  });

  it("handles hidden label", () => {
    render(DatePicker, { hideLabel: true });
    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("placeholder", "mm/dd/yyyy");
    expect(screen.getByText("Date")).toHaveClass("bx--visually-hidden");
  });

  it("forwards focus event from the input", () => {
    const focusHandler = vi.fn();
    render(DatePicker, {
      props: {
        onfocus: focusHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    input.focus();

    expect(focusHandler).toHaveBeenCalled();
    expect(focusHandler.mock.lastCall?.[0]).toBeInstanceOf(FocusEvent);
  });

  it("dispatches change event when manually typing in simple mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "simple",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.type(input, "01/15/2024");
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toBe("01/15/2024");
  });

  it("dispatches change event when manually typing in single mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "single",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.type(input, "01/15/2024");
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
      dateStr: "01/15/2024",
    });
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/314
  // and https://github.com/carbon-design-system/carbon-components-svelte/issues/950
  it("dispatches change event when manually clearing in single mode", async () => {
    const changeHandler = vi.fn();
    render(DatePicker, {
      props: {
        datePickerType: "single",
        value: "01/15/2024",
        onchange: changeHandler,
      },
    });

    const input = screen.getByLabelText("Date");
    await user.clear(input);
    await user.tab();

    expect(changeHandler).toHaveBeenCalled();
    expect(changeHandler.mock.lastCall?.[0]?.detail).toMatchObject({
      dateStr: "",
    });
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1862
  it("allows clearing range dates by setting valueFrom and valueTo to empty strings", async () => {
    const { rerender } = render(DatePickerRange, {
      props: {
        valueFrom: "01/15/2024",
        valueTo: "01/20/2024",
      },
    });

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
    expect(inputStart).toHaveValue("01/15/2024");
    expect(inputEnd).toHaveValue("01/20/2024");

    // Clear the dates by setting both values to empty strings
    rerender({ valueFrom: "", valueTo: "" });
    await tick();

    expect(inputStart).toHaveValue("");
    expect(inputEnd).toHaveValue("");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/893
  it("syncs both inputs when range values are programmatically updated", async () => {
    const { rerender } = render(DatePickerRange, {
      props: {
        valueFrom: "01/01/2024",
        valueTo: "12/31/2024",
      },
    });

    const inputStart = screen.getByLabelText("Start date");
    const inputEnd = screen.getByLabelText("End date");

    await user.click(inputStart);
    expect(
      await screen.findByLabelText("calendar-container"),
    ).toBeInTheDocument();
    expect(inputStart).toHaveValue("01/01/2024");
    expect(inputEnd).toHaveValue("12/31/2024");

    // Simulate programmatic update (e.g., from a month filter).
    rerender({ valueFrom: "01/01/2024", valueTo: "01/31/2024" });
    await tick();

    expect(inputStart).toHaveValue("01/01/2024");
    expect(inputEnd).toHaveValue("01/31/2024");

    // Update again to verify continued sync.
    rerender({ valueFrom: "03/01/2024", valueTo: "03/31/2024" });
    await tick();

    expect(inputStart).toHaveValue("03/01/2024");
    expect(inputEnd).toHaveValue("03/31/2024");
  });

  // Regression test: afterUpdate should not call calendar.setDate
  // when the bound value has not actually changed. Previously every
  // reactive tick (e.g. an unrelated prop update) re-applied setDate.
  it("does not call calendar.setDate on unrelated reactive updates", async () => {
    const { rerender } = render(DatePicker, {
      props: {
        datePickerType: "single",
        value: "01/15/2024",
      },
    });

    const input = screen.getByLabelText("Date") as HTMLInputElement;
    await user.click(input);
    await screen.findByLabelText("calendar-container");

    const fp = (input as unknown as { _flatpickr: { setDate: () => void } })
      ._flatpickr;
    expect(fp).toBeTruthy();
    const setDateSpy = vi.spyOn(fp, "setDate");

    // Trigger a reactive update that does not change value/min/max/format.
    await rerender({ light: true });
    await tick();

    expect(setDateSpy).not.toHaveBeenCalled();
  });

  it("supports custom label slot for DatePickerInput", () => {
    render(DatePickerInputSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1362
  describe("pattern derived from dateFormat", () => {
    it("derives a default pattern matching the default dateFormat (m/d/Y)", () => {
      render(DatePicker);

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{1,2}\\/\\d{1,2}\\/\\d{4}");
    });

    it("derives pattern for Y-m-d dateFormat", () => {
      render(DatePicker, { dateFormat: "Y-m-d" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{4}-\\d{1,2}-\\d{1,2}");
    });

    it("derives pattern for d.m.Y dateFormat", () => {
      render(DatePicker, { dateFormat: "d.m.Y" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{1,2}\\.\\d{1,2}\\.\\d{4}");
    });

    it("derives pattern for d/m/y dateFormat (2-digit year)", () => {
      render(DatePicker, { dateFormat: "d/m/y" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{1,2}\\/\\d{1,2}\\/\\d{2}");
    });

    it("derives pattern for M j, Y dateFormat (text month)", () => {
      render(DatePicker, { dateFormat: "M j, Y" });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\w+ \\d{1,2}, \\d{4}");
    });

    it("allows explicit pattern override on DatePickerInput", () => {
      render(DatePicker, {
        dateFormat: "Y-m-d",
        pattern: "\\d{4}-\\d{2}-\\d{2}",
      });

      const input = screen.getByLabelText("Date");
      expect(input).toHaveAttribute("pattern", "\\d{4}-\\d{2}-\\d{2}");
    });

    it("derived pattern validates Y-m-d formatted values", () => {
      render(DatePicker, { dateFormat: "Y-m-d" });

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      const re = new RegExp(`^${pattern}$`);
      expect(re.test("2026-02-10")).toBe(true);
      expect(re.test("02/10/2026")).toBe(false);
    });

    it("derived pattern validates m/d/Y formatted values", () => {
      render(DatePicker);

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      const re = new RegExp(`^${pattern}$`);
      expect(re.test("02/10/2026")).toBe(true);
      expect(re.test("2026-02-10")).toBe(false);
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2689
    // The HTML pattern attribute is evaluated with the `u` (Unicode) flag.
    // Escaped hyphens (`\-`) are invalid in Unicode mode and cause a SyntaxError,
    // which makes native form validation always fail.
    it.each([
      ["m/d/Y", "02/10/2026"],
      ["Y-m-d", "2026-02-10"],
      ["d.m.Y", "10.02.2026"],
      ["d/m/y", "10/02/26"],
      ["M j, Y", "Feb 10, 2026"],
    ])("derived pattern for %s is valid with the Unicode (u) flag", (dateFormat, sampleValue) => {
      render(DatePicker, { dateFormat });

      const input = screen.getByLabelText("Date");
      const pattern = input.getAttribute("pattern");
      expect(pattern).toBeTruthy();

      // This is how browsers evaluate the HTML pattern attribute.
      const re = new RegExp(`^(?:${pattern})$`, "u");
      expect(re.test(sampleValue)).toBe(true);
    });
  });

  describe("bind:calendar", () => {
    it("is null in simple mode (no calendar is created)", async () => {
      let captured: unknown = "unset";
      render(DatePickerCalendar, {
        props: {
          datePickerType: "simple",
          oncalendar: (cal) => {
            captured = cal;
          },
        },
      });

      await tick();
      expect(captured).toBeNull();
    });

    it("exposes the flatpickr instance in single mode", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "single",
          oncalendar: (cal) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      // Smoke-check the flatpickr API surface — these are the methods
      // consumers are most likely to call imperatively.
      expect(typeof instance.open).toBe("function");
      expect(typeof instance.close).toBe("function");
      expect(typeof instance.setDate).toBe("function");
      expect(typeof instance.jumpToDate).toBe("function");
      expect(typeof instance.set).toBe("function");
      expect(instance.isOpen).toBe(false);
    });

    it("can open and close the calendar via the bound instance", async () => {
      let captured: Instance | null | undefined = null;
      render(DatePickerCalendar, {
        props: {
          datePickerType: "single",
          oncalendar: (cal) => {
            captured = cal;
          },
        },
      });

      const instance = await vi.waitFor(() => {
        if (!captured) throw new Error("calendar not set");
        return captured;
      });

      expect(instance.isOpen).toBe(false);

      instance.open();
      await tick();
      expect(instance.isOpen).toBe(true);
      const calendar = await screen.findByLabelText("calendar-container");
      expect(calendar).toHaveClass("open");

      instance.close();
      await tick();
      expect(instance.isOpen).toBe(false);
      expect(calendar).not.toHaveClass("open");
    });
  });

  describe("portalMenu", () => {
    afterEach(() => {
      // Clean up any flatpickr calendars appended to document.body.
      for (const el of document.body.querySelectorAll(".flatpickr-calendar")) {
        el.remove();
      }
    });

    it("renders calendar inside the date picker wrapper by default", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(true);
    });

    it("renders calendar at document.body when portalMenu is true", async () => {
      const { container } = render(DatePicker, {
        datePickerType: "single",
        portalMenu: true,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(false);
      expect(document.body.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(false);
    });

    it("renders calendar at document.body when inside Modal (portalMenu not passed)", async () => {
      const { container } = render(DatePickerInModal, {
        modalOpen: true,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(false);
      expect(document.body.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(false);
    });

    it("renders calendar inside wrapper when inside Modal with portalMenu=false", async () => {
      const { container } = render(DatePickerInModal, {
        modalOpen: true,
        portalMenu: false,
      });

      const input = screen.getByLabelText("Date");
      await user.click(input);

      const calendar = await screen.findByLabelText("calendar-container");
      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper?.contains(calendar)).toBe(true);
      expect(calendar.classList.contains("static")).toBe(true);
    });
  });
});

describe("DatePickerSkeleton", () => {
  it("renders decorative label placeholders without label elements in range mode", () => {
    const { container } = render(DatePickerSkeleton, { range: true });

    expect(container.querySelectorAll("label")).toHaveLength(0);
    expect(container.querySelectorAll("span.bx--label")).toHaveLength(2);
  });
});
