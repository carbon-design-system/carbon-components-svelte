import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import NaturalDateInput from "./NaturalDateInput.test.svelte";

// Thursday, November 12, 2026, 10:30 in New York (the host's `now`).
const input = () => screen.getByRole<HTMLInputElement>("textbox");
const button = () => screen.getByRole("button", { name: "Choose a date" });
const bound = () => screen.getByTestId("bound").textContent;
// The interpretation is wrapped in isolates, which are not words.
const clean = (text: string | null | undefined) =>
  (text ?? "").replace(/[\u2068\u2069]/g, "");
const helper = (container: HTMLElement) =>
  clean(container.querySelector(".bx--form__helper-text")?.textContent);

describe("NaturalDateInput", () => {
  it("renders a labeled field, a calendar button and examples", () => {
    render(NaturalDateInput);

    expect(screen.getByLabelText("Due date")).toBe(input());
    expect(input()).toHaveAttribute(
      "placeholder",
      "tomorrow, next Fri 3pm, Dec 3",
    );
    expect(button()).toHaveAttribute("aria-haspopup", "dialog");
    expect(button()).toHaveAttribute("aria-expanded", "false");
  });

  it("reads back what it understood while the user types", async () => {
    const { container } = render(NaturalDateInput, {
      props: { helperText: "Pick a day" },
    });
    expect(helper(container)).toBe("Pick a day");

    await user.type(input(), "tomorrow 3pm");

    expect(helper(container)).toMatch(/^Friday, Nov 13, 2026(,| at) 3:00 PM$/);
    // The field points at the interpretation.
    const helperEl = container.querySelector(".bx--form__helper-text");
    expect(input().getAttribute("aria-describedby")).toContain(
      helperEl?.id as string,
    );
    // Nothing is committed until the user leaves.
    expect(bound()).toBe("null");
  });

  it("falls back to the helper text when the text is not a date", async () => {
    const { container } = render(NaturalDateInput, {
      props: { helperText: "Pick a day" },
    });

    await user.type(input(), "tomorrow 3pm");
    await user.clear(input());
    await user.type(input(), "tomor");

    expect(helper(container)).toBe("Pick a day");
    expect(input()).not.toHaveAttribute("aria-invalid");
  });

  it("commits on blur, shows the date and tells the app", async () => {
    const onChange = vi.fn();
    render(NaturalDateInput, { props: { onChange } });

    await user.type(input(), "next fri 3pm");
    expect(onChange).not.toHaveBeenCalled();
    await user.tab();

    // 3 PM in New York on Friday, November 20.
    expect(bound()).toBe("2026-11-20T20:00:00.000Z");
    expect(screen.getByTestId("has-time")).toHaveTextContent("true");
    expect(input()).toHaveValue("Nov 20, 2026, 3:00 PM");
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0]).toMatchObject({
      iso: "2026-11-20T20:00:00.000Z",
      hasTime: true,
      valid: true,
      trigger: "blur",
      text: "Nov 20, 2026, 3:00 PM",
    });
    expect(onChange.mock.calls[0][0].date).toEqual(
      new Date("2026-11-20T20:00:00Z"),
    );
  });

  it("commits on Enter without leaving the field", async () => {
    const onChange = vi.fn();
    render(NaturalDateInput, { props: { onChange } });

    await user.type(input(), "tomorrow{Enter}");

    expect(bound()).toBe("2026-11-13T05:00:00.000Z");
    expect(screen.getByTestId("has-time")).toHaveTextContent("false");
    expect(input()).toHaveValue("Nov 13, 2026");
    expect(input()).toHaveFocus();
    expect(onChange.mock.calls[0][0]).toMatchObject({
      trigger: "enter",
      iso: "2026-11-13",
    });
  });

  it("does not commit on Enter during an IME composition", async () => {
    const onChange = vi.fn();
    render(NaturalDateInput, { props: { onChange } });

    await user.type(input(), "tomorrow");
    await fireEvent.keyDown(input(), { key: "Enter", keyCode: 229 });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the typed words with keepText", async () => {
    render(NaturalDateInput, { props: { keepText: true } });

    await user.type(input(), "tomorrow{Enter}");

    expect(input()).toHaveValue("tomorrow");
    expect(bound()).toBe("2026-11-13T05:00:00.000Z");
  });

  it("only reports a change when the text changed", async () => {
    const onChange = vi.fn();
    render(NaturalDateInput, { props: { onChange } });

    await user.click(input());
    await user.tab();
    await user.click(input());
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
  });

  describe("text that is not a date", () => {
    it("stays quiet until the user leaves the field, then explains", async () => {
      const onChange = vi.fn();
      const { container } = render(NaturalDateInput, { props: { onChange } });

      await user.type(input(), "blah");
      expect(input()).not.toHaveAttribute("aria-invalid");

      await user.tab();
      expect(input()).toHaveAttribute("aria-invalid", "true");
      const message = screen.getByText("Couldn't read that as a date");
      expect(message).toHaveAttribute("role", "alert");
      expect(input().getAttribute("aria-describedby")).toContain(message.id);
      expect(bound()).toBe("null");
      expect(input()).toHaveValue("blah");
      expect(onChange.mock.calls[0][0]).toMatchObject({
        valid: false,
        date: null,
      });
      expect(container.querySelector(".bx--form__helper-text")).toBeNull();

      // Editing takes the error back until the next blur.
      await user.type(input(), "x");
      expect(input()).not.toHaveAttribute("aria-invalid");
    });

    it("holds back a form submit, and lets a date through", async () => {
      render(NaturalDateInput, { props: { name: "due" } });
      const form = screen.getByTestId<HTMLFormElement>("form");

      await user.type(input(), "blah");
      expect(form.checkValidity()).toBe(false);
      expect(input().validationMessage).toBe("Couldn't read that as a date");

      await user.clear(input());
      await user.type(input(), "dec 3");
      expect(form.checkValidity()).toBe(true);
    });

    it("clears a committed value", async () => {
      render(NaturalDateInput);

      await user.type(input(), "tomorrow{Enter}");
      expect(bound()).not.toBe("null");
      await user.clear(input());
      await user.type(input(), "blah{Enter}");

      expect(bound()).toBe("null");
      expect(screen.getByTestId("has-time")).toHaveTextContent("false");
    });
  });

  describe("rules", () => {
    it("asks for a date when it is required", async () => {
      render(NaturalDateInput, { props: { required: true } });

      expect(input()).toBeRequired();
      await user.click(input());
      await user.tab();

      expect(screen.getByText("Enter a date")).toBeInTheDocument();
    });

    it('rejects a time with time="none"', async () => {
      render(NaturalDateInput, { props: { time: "none" } });

      await user.type(input(), "tomorrow 3pm{Enter}");

      expect(screen.getByText("Use a date without a time")).toBeInTheDocument();
      expect(bound()).toBe("null");
      await user.clear(input());
      await user.type(input(), "tomorrow{Enter}");
      expect(bound()).toBe("2026-11-13T05:00:00.000Z");
    });

    it('rejects a date alone with time="required"', async () => {
      render(NaturalDateInput, { props: { time: "required" } });

      await user.type(input(), "tomorrow{Enter}");
      expect(screen.getByText("Add a time, such as 3pm")).toBeInTheDocument();

      await user.clear(input());
      await user.type(input(), "tomorrow 3pm{Enter}");
      expect(bound()).toBe("2026-11-13T20:00:00.000Z");
    });

    it("holds a date to min and max, by the day when it has no time", async () => {
      render(NaturalDateInput, {
        props: {
          min: "2026-11-14T15:00:00Z",
          max: new Date("2026-11-20T15:00:00Z"),
        },
      });

      await user.type(input(), "tomorrow{Enter}");
      expect(screen.getByText("Choose a later date")).toBeInTheDocument();

      await user.clear(input());
      await user.type(input(), "nov 14{Enter}");
      // A date with no time is its day, which min's day holds.
      expect(bound()).toBe("2026-11-14T05:00:00.000Z");

      await user.clear(input());
      await user.type(input(), "nov 21{Enter}");
      expect(screen.getByText("Choose an earlier date")).toBeInTheDocument();
    });
  });

  describe("locale", () => {
    it("reads 3/12 in the locale's order and shows the other reading", async () => {
      const { container, rerender } = render(NaturalDateInput, {
        props: { locale: "en-US" },
      });

      await user.type(input(), "3/12/2027");
      expect(helper(container)).toBe("Friday, Mar 12, 2027 (or Dec 3, 2027)");

      await rerender({ locale: "en-GB" });
      expect(helper(container)).toMatch(
        /^Friday,? 3 Dec 2027 \(or 12 Mar 2027\)$/,
      );
    });

    it("reads 25/12 in the only order that is a date", async () => {
      const { container } = render(NaturalDateInput, {
        props: { locale: "en-US" },
      });

      await user.type(input(), "25/12/2027");

      expect(helper(container)).toBe("Saturday, Dec 25, 2027");
    });

    it("writes the interpretation and the text in the locale", async () => {
      const { container } = render(NaturalDateInput, {
        props: { locale: "de", timeZone: "Europe/Berlin" },
      });

      await user.type(input(), "3.12.2027 15:30{Enter}");

      expect(helper(container)).toMatch(/^Freitag, 3\. Dez\.? 2027/);
      expect(input()).toHaveValue("3. Dez. 2027, 15:30");
      expect(bound()).toBe("2027-12-03T14:30:00.000Z");
    });

    it("reads relative words from the pack it is given", async () => {
      render(NaturalDateInput, {
        props: {
          locale: "de",
          pack: { id: "de", locale: "de", words: { morgen: ["day", 1] } },
        },
      });

      await user.type(input(), "morgen{Enter}");

      expect(bound()).toBe("2026-11-13T05:00:00.000Z");
    });
  });

  describe("value", () => {
    it("shows a date given as value", () => {
      render(NaturalDateInput, {
        props: { value: new Date("2026-12-03T20:00:00Z") },
      });

      expect(input()).toHaveValue("Dec 3, 2026, 3:00 PM");
      expect(screen.getByTestId("has-time")).toHaveTextContent("true");
    });

    it("shows an ISO date given as value, as a day with no time", () => {
      render(NaturalDateInput, { props: { value: "2026-12-03" } });

      expect(input()).toHaveValue("Dec 3, 2026");
      expect(screen.getByTestId("has-time")).toHaveTextContent("false");
    });

    it("rewrites the text when value changes, and clears it for null", async () => {
      const { rerender } = render(NaturalDateInput);

      await rerender({ value: new Date("2026-12-03T05:00:00Z") });
      expect(input()).toHaveValue("Dec 3, 2026");

      await rerender({ value: null });
      expect(input()).toHaveValue("");
    });

    it("tells the app nothing when it sets value itself", async () => {
      const onChange = vi.fn();
      const { rerender } = render(NaturalDateInput, { props: { onChange } });

      await rerender({ value: new Date("2026-12-03T05:00:00Z") });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('writes an ISO string with valueType="iso"', async () => {
      const onChange = vi.fn();
      render(NaturalDateInput, { props: { valueType: "iso", onChange } });

      await user.type(input(), "dec 3{Enter}");
      expect(bound()).toBe("2026-12-03");

      await user.clear(input());
      await user.type(input(), "dec 3 3pm{Enter}");
      expect(bound()).toBe("2026-12-03T20:00:00.000Z");
      expect(onChange.mock.calls[1][0].value).toBe("2026-12-03T20:00:00.000Z");
    });

    it("commits text the app sets, as typing does", async () => {
      const { rerender } = render(NaturalDateInput);

      await rerender({ text: "dec 3" });

      expect(bound()).toBe("2026-12-03T05:00:00.000Z");
      expect(input()).toHaveValue("Dec 3, 2026");
    });
  });

  describe("in a form", () => {
    it("submits the date, not the text, as it is typed", async () => {
      render(NaturalDateInput, { props: { name: "due" } });
      const form = screen.getByTestId<HTMLFormElement>("form");

      expect(new FormData(form).get("due")).toBe("");
      await user.type(input(), "dec 3");
      expect(new FormData(form).get("due")).toBe("2026-12-03");

      await user.type(input(), " at 3pm");
      expect(new FormData(form).get("due")).toBe("2026-12-03T20:00:00.000Z");
      // The input itself has no name, so the text is not submitted.
      expect(input()).not.toHaveAttribute("name");
    });

    it("clears on reset", async () => {
      render(NaturalDateInput, { props: { name: "due" } });
      const form = screen.getByTestId<HTMLFormElement>("form");

      await user.type(input(), "dec 3{Enter}");
      expect(bound()).not.toBe("null");
      form.reset();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve));

      expect(input()).toHaveValue("");
      expect(bound()).toBe("null");
      expect(new FormData(form).get("due")).toBe("");
    });
  });

  describe("states", () => {
    it("disables the field and the button", () => {
      render(NaturalDateInput, { props: { disabled: true } });

      expect(input()).toBeDisabled();
      expect(button()).toBeDisabled();
    });

    it("hides the calendar button, and Alt+ArrowDown does nothing", async () => {
      render(NaturalDateInput, { props: { calendar: false } });

      expect(screen.queryByRole("button")).toBeNull();
      await user.click(input());
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("shows an invalid state the app sets, over the date's own", () => {
      render(NaturalDateInput, {
        props: { invalid: true, invalidText: "Taken" },
      });

      expect(screen.getByText("Taken")).toBeInTheDocument();
      expect(input()).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("announcements", () => {
    it("reads the interpretation after typing settles, not on each key", async () => {
      render(NaturalDateInput);
      const status = () => screen.getByRole("status");

      await user.type(input(), "tomorrow");
      expect(status().textContent).toBe("");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(clean(status().textContent)).toBe("Friday, Nov 13, 2026");
    });

    it("does not read an interpretation nobody typed", async () => {
      render(NaturalDateInput, { props: { value: "2026-12-03" } });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(screen.getByRole("status").textContent).toBe("");
    });
  });

  describe("calendar", () => {
    it("opens as a dialog on the current date, and returns focus when closed", async () => {
      render(NaturalDateInput, { props: { value: "2026-12-03" } });

      await user.click(button());

      const dialog = screen.getByRole("dialog", { name: "Choose a date" });
      expect(button()).toHaveAttribute("aria-expanded", "true");
      expect(button()).toHaveAttribute("aria-controls", dialog.id);
      expect(screen.getByRole("grid")).toHaveAccessibleName("December 2026");
      expect(
        screen.getByRole("gridcell", { name: /Thursday, December 3, 2026/ }),
      ).toHaveFocus();

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(button()).toHaveFocus();
      expect(button()).toHaveAttribute("aria-expanded", "false");
    });

    it("opens on Alt+ArrowDown in the field", async () => {
      render(NaturalDateInput);

      await user.click(input());
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      // Today, since there is no date yet.
      expect(
        screen.getByRole("gridcell", { name: /Thursday, November 12, 2026/ }),
      ).toHaveFocus();
    });

    it("picks a day with the keyboard, keeping the time that was typed", async () => {
      const onChange = vi.fn();
      render(NaturalDateInput, { props: { onChange } });
      await user.type(input(), "dec 3 3pm");

      await user.click(button());
      await user.keyboard("{ArrowRight}{Enter}");

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(button()).toHaveFocus();
      expect(input()).toHaveValue("Dec 4, 2026, 3:00 PM");
      expect(bound()).toBe("2026-12-04T20:00:00.000Z");
      // Leaving the field committed the first date; the calendar the second.
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[1][0]).toMatchObject({ trigger: "calendar" });
    });

    it("picks a day with the mouse and sets a date with no time", async () => {
      render(NaturalDateInput);

      await user.click(button());
      await user.click(
        screen.getByRole("gridcell", { name: /Saturday, November 14, 2026/ }),
      );

      expect(input()).toHaveValue("Nov 14, 2026");
      expect(screen.getByTestId("has-time")).toHaveTextContent("false");
      expect(bound()).toBe("2026-11-14T05:00:00.000Z");
    });

    it("closes with Escape without closing what it sits in", async () => {
      const onKeydown = vi.fn();
      render(NaturalDateInput, { props: { onKeydown } });

      await user.click(button());
      await user.keyboard("{Escape}");

      expect(onKeydown).not.toHaveBeenCalled();
      // With the calendar shut, Escape belongs to whoever is listening.
      await user.click(input());
      await user.keyboard("{Escape}");
      expect(onKeydown).toHaveBeenCalledOnce();
    });

    it("closes on a click outside and when focus leaves", async () => {
      const onClose = vi.fn();
      render(NaturalDateInput, { props: { onClose } });

      await user.click(button());
      await user.click(document.body);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(onClose).toHaveBeenLastCalledWith({ trigger: "outside-click" });

      await user.click(button());
      input().focus();
      await tick();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(onClose).toHaveBeenLastCalledWith({ trigger: "blur" });
    });

    it("toggles from the button", async () => {
      render(NaturalDateInput);

      await user.click(button());
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await user.click(button());
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("greys out days outside min and max", async () => {
      render(NaturalDateInput, {
        props: { min: "2026-11-13", max: "2026-11-20" },
      });

      await user.click(button());

      expect(
        screen.getByRole("gridcell", { name: /Thursday, November 12, 2026/ }),
      ).toHaveAttribute("aria-disabled", "true");
      expect(
        screen.getByRole("gridcell", { name: /Friday, November 13, 2026/ }),
      ).not.toHaveAttribute("aria-disabled");
    });

    it("does not open when disabled or read-only", async () => {
      const { rerender } = render(NaturalDateInput, {
        props: { readonly: true },
      });
      await fireEvent.keyDown(input(), { key: "ArrowDown", altKey: true });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

      await rerender({ readonly: false, disabled: true });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
  });
});
