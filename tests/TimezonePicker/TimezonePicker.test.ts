import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TimezonePicker from "./TimezonePicker.test.svelte";

const values = [
  "America/Los_Angeles",
  "America/New_York",
  "Europe/Paris",
  "Asia/Calcutta",
  "UTC",
];

function getInput() {
  const input = screen.getByRole("combobox");
  assert(input instanceof HTMLInputElement);
  return input;
}

describe("TimezonePicker", () => {
  it("shows the city of the value in the field", () => {
    render(TimezonePicker, {
      props: { values, value: "America/Los_Angeles", detect: false },
    });

    expect(getInput()).toHaveValue("Los Angeles");
  });

  it("lists zones with their offset and generic name", async () => {
    render(TimezonePicker, {
      props: {
        values,
        detect: false,
        date: new Date("2026-01-15T12:00:00Z"),
        labelText: "Zone",
      },
    });

    await user.click(getInput());

    const option = screen.getByRole("option", { name: /Los Angeles/ });
    expect(option).toHaveTextContent("Pacific Time");
    expect(option).toHaveTextContent("UTC-08:00");
    expect(screen.getByRole("option", { name: /Kolkata/ })).toHaveTextContent(
      "UTC+05:30",
    );
  });

  it("reads offsets at `date`, so daylight time shows in July", async () => {
    render(TimezonePicker, {
      props: {
        values,
        detect: false,
        date: new Date("2026-07-15T12:00:00Z"),
      },
    });

    await user.click(getInput());

    expect(
      screen.getByRole("option", { name: /Los Angeles/ }),
    ).toHaveTextContent("UTC-07:00");
  });

  it("searches by city, abbreviation, offset and generic name", async () => {
    render(TimezonePicker, {
      props: {
        values,
        detect: false,
        date: new Date("2026-07-15T12:00:00Z"),
      },
    });
    const input = getInput();
    await user.click(input);

    const matches = async (query: string) => {
      await user.clear(input);
      await user.type(input, query);
      return screen.queryAllByRole("option").map((o) => o.textContent);
    };

    expect(await matches("paris")).toHaveLength(1);
    // "PST" is the winter abbreviation, and July is daylight time.
    expect(await matches("PST")).toEqual([expect.stringContaining("Los")]);
    expect(await matches("pdt")).toEqual([expect.stringContaining("Los")]);
    expect(await matches("+5:30")).toEqual([
      expect.stringContaining("Kolkata"),
    ]);
    expect(await matches("utc-8")).toEqual([expect.stringContaining("Los")]);
    expect(await matches("pacific")).toEqual([expect.stringContaining("Los")]);
    // The old IANA name finds the renamed city.
    expect(await matches("calcutta")).toEqual([
      expect.stringContaining("Kolkata"),
    ]);
  });

  it("selects a zone with the pick, binds the code, and dispatches change", async () => {
    const onChange = vi.fn();
    render(TimezonePicker, {
      props: { values, detect: false, name: "tz", onChange },
    });

    await user.click(getInput());
    await user.click(screen.getByRole("option", { name: /Paris/ }));

    expect(getInput()).toHaveValue("Paris");
    expect(document.querySelector('input[name="tz"]')).toHaveValue(
      "Europe/Paris",
    );
    expect(screen.getByTestId("bound")).toHaveTextContent("Europe/Paris");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({
      value: "Europe/Paris",
      label: "Paris",
      area: "Europe",
    });
  });

  it("does not dispatch change when `value` is set from outside", async () => {
    const onChange = vi.fn();
    const { rerender } = render(TimezonePicker, {
      props: { values, detect: false, onChange },
    });

    await rerender({ value: "Europe/Paris" });
    await tick();

    expect(getInput()).toHaveValue("Paris");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects the zone for an alias the engine spells differently", () => {
    render(TimezonePicker, {
      props: { values, detect: false, value: "Asia/Kolkata" },
    });

    expect(getInput()).toHaveValue("Kolkata");
  });

  it("fills an empty value with the browser's zone after mount", async () => {
    const resolved = Intl.DateTimeFormat.prototype.resolvedOptions;
    vi.spyOn(
      Intl.DateTimeFormat.prototype,
      "resolvedOptions",
    ).mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...resolved.call(this), timeZone: "Europe/Paris" };
    });
    const onChange = vi.fn();
    render(TimezonePicker, { props: { detect: true, onChange } });

    await waitFor(() => expect(getInput()).toHaveValue("Paris"));
    expect(screen.getByTestId("bound")).toHaveTextContent("Europe/Paris");
    expect(onChange).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("keeps a given value when detecting", async () => {
    render(TimezonePicker, {
      props: { values, value: "Europe/Paris", detect: true },
    });
    await tick();

    expect(getInput()).toHaveValue("Paris");
  });

  it("renames the menu when the locale changes", async () => {
    const { rerender } = render(TimezonePicker, {
      props: { values, detect: false, value: "Europe/Paris", locale: "en" },
    });
    await user.click(getInput());
    expect(screen.getByRole("option", { name: /Paris/ })).toHaveTextContent(
      "Central European Time",
    );

    await rerender({ locale: "fr" });

    expect(screen.getByRole("option", { name: /Paris/ })).toHaveTextContent(
      "heure d’Europe centrale",
    );
  });

  it("clears the value with the clear button", async () => {
    const onChange = vi.fn();
    render(TimezonePicker, {
      props: { values, detect: false, value: "Europe/Paris", onChange },
    });

    await user.click(
      screen.getByRole("button", { name: "Clear selected item" }),
    );

    expect(getInput()).toHaveValue("");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "" }),
    );
  });

  it("keeps the offset on the left-to-right side in an RTL locale", async () => {
    render(TimezonePicker, {
      props: { values, detect: false, locale: "ar" },
    });
    await user.click(getInput());

    const offset = screen
      .getByRole("option", { name: /Paris/ })
      .querySelector(".bx--intl-picker__trailing");
    expect(offset?.querySelector("bdi")).toHaveAttribute("dir", "ltr");
    expect(offset).toHaveTextContent("UTC+01:00");
  });
});
