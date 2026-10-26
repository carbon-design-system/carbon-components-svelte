import { render, screen, within } from "@testing-library/svelte";
import MeterComponent from "carbon-components-svelte/Meter/Meter.svelte";
// svelte-check's Svelte 4 compat pass can't resolve this fixture's
// declaration file, for reasons independent of file content (reproduces
// even for a trivial one-line fixture unrelated to Meter). @ts-expect-error
// would itself fail under Svelte 5, where this import has no real error.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- see comment above
// @ts-ignore
import Meter from "./Meter.test.svelte";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- see comment above
// @ts-ignore
import MeterStatus from "./MeterStatus.test.svelte";

/** Returns the `meter` element inside the fixture instance with this test id. */
function getMeter(testId: string, options?: { name: string }) {
  return within(screen.getByTestId(testId)).getByRole("meter", options);
}

/** Returns the trimmed text of the live region in the MeterStatus fixture. */
function getAnnouncement() {
  return screen
    .getByTestId("status")
    .querySelector("[aria-live]")
    ?.textContent?.trim();
}

describe("Meter", () => {
  it("renders ARIA min/max/now", () => {
    render(Meter);

    const meter = getMeter("basic", { name: "Storage" });
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "1000");
    expect(meter).toHaveAttribute("aria-valuenow", "812");
  });

  it("uses valueText for aria-valuetext and visible text", () => {
    render(Meter);

    const el = screen.getByTestId("value-text");
    const meter = within(el).getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuetext", "812 GB of 1 TB");
    expect(el).toHaveTextContent("812 GB of 1 TB");
  });

  it.each([
    ["warning", ["bx--meter--warning"], ["bx--meter--error"]],
    ["error", ["bx--meter--error"], []],
    ["neither", [], ["bx--meter--warning", "bx--meter--error"]],
    ["explicit-success", ["bx--meter--success"], ["bx--meter--error"]],
  ])("derives the status classes for %s", (testId, present, absent) => {
    render(Meter);

    const el = screen.getByTestId(testId);
    for (const className of present) expect(el).toHaveClass(className);
    for (const className of absent) expect(el).not.toHaveClass(className);
  });

  it("caps aria-valuenow and marks over-capacity when value exceeds max", () => {
    render(Meter);

    const el = screen.getByTestId("over-capacity");
    const meter = within(el).getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "1000");
    expect(el).toHaveClass("bx--meter--over");
    expect(el).toHaveClass("bx--meter--error");
  });

  it.each([["negative-value"], ["nan-value"]])(
    "renders an empty bar with aria-valuenow 0 for %s",
    (testId) => {
      render(Meter);

      const el = screen.getByTestId(testId);
      const meter = within(el).getByRole("meter");
      expect(meter).toHaveAttribute("aria-valuenow", "0");
      expect(meter).toHaveAttribute("aria-valuemin", "0");
      expect(el.querySelector(".bx--meter__bar")).toHaveStyle({
        transform: "scaleX(0)",
      });
    },
  );

  it("clamps an infinite value to a full bar like any large value", () => {
    render(Meter);

    const el = screen.getByTestId("infinite-value");
    expect(within(el).getByRole("meter")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(el.querySelector(".bx--meter__bar")).toHaveStyle({
      transform: "scaleX(1)",
    });
  });

  it("announces the real value and status when over capacity and valueText is unset", () => {
    render(Meter);

    const meter = getMeter("over-capacity");
    expect(meter).toHaveAttribute("aria-valuetext", "1,200 of 1,000, Error");
  });

  it("keeps valueText for aria-valuetext even when the value is over capacity", () => {
    render(Meter);

    const meter = getMeter("over-capacity-value-text");
    expect(meter).toHaveAttribute("aria-valuetext", "812 GB of 1 TB");
  });

  it("omits aria-valuetext when the value is in range with no thresholds and no valueText", () => {
    render(Meter);

    const meter = getMeter("basic");
    expect(meter).not.toHaveAttribute("aria-valuetext");
  });

  it("appends the derived warning status to aria-valuetext when valueText is unset", () => {
    render(Meter);

    const meter = getMeter("warning");
    expect(meter).toHaveAttribute("aria-valuetext", "812 of 1,000, Warning");
  });

  it("describes the status when valueText is set", () => {
    render(Meter);

    const meter = getMeter("value-text-error");
    expect(meter).toHaveAttribute("aria-valuetext", "960 GB of 1 TB");
    expect(meter).toHaveAccessibleDescription("Error");
  });

  it("does not describe the status twice when valueText is unset", () => {
    render(Meter);

    const meter = getMeter("warning");
    expect(meter).toHaveAccessibleDescription("");
  });

  it("uses a custom errorText in aria-valuetext", () => {
    render(Meter);

    const meter = getMeter("custom-error-text");
    expect(meter).toHaveAttribute("aria-valuetext", "960 of 1,000, Critical");
  });

  it("uses a custom valueRangeText in aria-valuetext", () => {
    render(Meter);

    const meter = getMeter("custom-value-range-text");
    expect(meter).toHaveAttribute("aria-valuetext", "1200/1000, Error");
  });

  it("visually hides the whole label row when hideLabel is set", () => {
    render(Meter);

    const el = screen.getByTestId("hidden-label");
    expect(el.querySelector(".bx--meter__label")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(
      within(el).getByRole("meter", { name: "Storage" }),
    ).toBeInTheDocument();
  });

  it("keeps the label row for value text when hideLabel is set", () => {
    render(Meter);

    const el = screen.getByTestId("hidden-label-value-text");
    expect(el.querySelector(".bx--meter__label")).not.toHaveClass(
      "bx--visually-hidden",
    );
    expect(el.querySelector(".bx--meter__label-text")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(within(el).getByText("812 GB of 1 TB")).toBeVisible();
  });

  it("hides the label row when hideLabel is set and valueText is whitespace", () => {
    render(Meter);

    const el = screen.getByTestId("hidden-label-whitespace-value-text");
    expect(el.querySelector(".bx--meter__label")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(el.querySelector(".bx--meter__value-text")).toBeNull();
  });

  it("renders a threshold marker per defined key when showThresholds is set", () => {
    render(Meter);

    const el = screen.getByTestId("show-thresholds");
    const thresholds = el.querySelectorAll(".bx--meter__threshold");
    expect(thresholds).toHaveLength(2);
    expect(thresholds[0]).toHaveStyle({ left: "80%" });
    expect(thresholds[1]).toHaveStyle({ left: "95%" });
  });

  it("does not throw and renders a zero-width bar when max is 0", () => {
    render(Meter);

    const el = screen.getByTestId("zero-max");
    expect(el.querySelector(".bx--meter__bar")).toHaveStyle({
      transform: "scaleX(0)",
    });
  });

  it("announces a status transition to warning and error, and stays quiet for default and value ticks", async () => {
    const { rerender } = render(MeterStatus);

    expect(getAnnouncement()).toBe("");

    await rerender({ value: 10, status: "warning" });
    expect(getAnnouncement()).toBe("Warning");

    await rerender({ value: 10, status: "error" });
    expect(getAnnouncement()).toBe("Error");

    await rerender({ value: 10, status: "default" });
    expect(getAnnouncement()).toBe("");

    await rerender({ value: 20, status: "default" });
    expect(getAnnouncement()).toBe("");
  });

  it("derives the status from value crossing thresholds, inclusive at each threshold", async () => {
    const thresholds = { warning: 50, error: 90 };
    const { rerender } = render(MeterStatus, {
      props: { value: 10, thresholds },
    });

    const root = screen.getByTestId("status");
    const meter = within(root).getByRole("meter");
    expect(root).not.toHaveClass("bx--meter--warning", "bx--meter--error");
    expect(getAnnouncement()).toBe("");

    await rerender({ value: 50, thresholds });
    expect(root).toHaveClass("bx--meter--warning");
    expect(meter).toHaveAttribute("aria-valuetext", "50 of 100, Warning");
    expect(getAnnouncement()).toBe("Warning");

    await rerender({ value: 90, thresholds });
    expect(root).toHaveClass("bx--meter--error");
    expect(meter).toHaveAttribute("aria-valuetext", "90 of 100, Error");
    expect(getAnnouncement()).toBe("Error");
  });

  it("uses a custom warningText in aria-valuetext and the announcement", async () => {
    const thresholds = { warning: 50, error: 90 };
    const { rerender } = render(MeterStatus, {
      props: { value: 10, thresholds, warningText: "Careful" },
    });

    await rerender({ value: 60, thresholds, warningText: "Careful" });
    expect(
      within(screen.getByTestId("status")).getByRole("meter"),
    ).toHaveAttribute("aria-valuetext", "60 of 100, Careful");
    expect(getAnnouncement()).toBe("Careful");
  });

  it("clamps threshold markers to the track when a threshold is outside 0 to max", () => {
    render(Meter);

    const markers = screen
      .getByTestId("out-of-range-thresholds")
      .querySelectorAll(".bx--meter__threshold");
    expect(markers[0]).toHaveStyle({ left: "100%" });
    expect(markers[1]).toHaveStyle({ left: "0%" });
  });

  it("keeps the label row visible for valueChildren when hideLabel is set", () => {
    render(Meter);

    const el = screen.getByTestId("value-children");
    expect(el.querySelector(".bx--meter__label")).not.toHaveClass(
      "bx--visually-hidden",
    );
    expect(el.querySelector(".bx--meter__value-text strong")).toHaveTextContent(
      "50 of 100",
    );
  });

  it("stays quiet when a meter mounts already in error", () => {
    render(MeterStatus, { props: { value: 10, status: "error" } });

    expect(getAnnouncement()).toBe("");
  });

  it("announces a custom errorText on transition to error", async () => {
    const { rerender } = render(MeterStatus, {
      props: { value: 10, errorText: "Critical" },
    });

    expect(getAnnouncement()).toBe("");

    await rerender({ value: 10, status: "error", errorText: "Critical" });
    expect(getAnnouncement()).toBe("Critical");
  });

  it("describes both thresholds in a hidden sentence", () => {
    render(Meter);

    const el = screen.getByTestId("thresholds-both");
    const meter = within(el).getByRole("meter");
    const text = within(el).getByText("Warning at 700, error at 900");
    expect(meter).toHaveAttribute("aria-describedby", text.id);
  });

  it("describes only the warning threshold when error is undefined", () => {
    render(Meter);

    const el = screen.getByTestId("thresholds-warning-only");
    const meter = within(el).getByRole("meter");
    const text = within(el).getByText("Warning at 700");
    expect(meter).toHaveAttribute("aria-describedby", text.id);
    expect(text).not.toHaveTextContent(/error at/i);
  });

  it("omits the threshold description and markers when showThresholds is set but thresholds is unset", async () => {
    const { container, rerender } = render(MeterComponent, {
      props: {
        labelText: "Storage",
        value: 812,
        max: 1000,
        showThresholds: true,
      },
    });

    const meter = within(container).getByRole("meter");
    expect(meter).not.toHaveAttribute("aria-describedby");
    expect(container.querySelectorAll(".bx--meter__threshold")).toHaveLength(0);
    expect(
      within(container).queryByText(/warning at/i),
    ).not.toBeInTheDocument();

    await rerender({ thresholds: { warning: 700 } });
    expect(container.querySelectorAll(".bx--meter__threshold")).toHaveLength(1);
    expect(meter).toHaveAttribute(
      "aria-describedby",
      within(container).getByText("Warning at 700").id,
    );
  });

  it("lists the helper text before the threshold sentence in aria-describedby", () => {
    render(Meter);

    const el = screen.getByTestId("helper-and-thresholds");
    const meter = within(el).getByRole("meter");
    const helperText = within(el).getByText("Approaching limit");
    const thresholdsText = within(el).getByText("Warning at 700, error at 900");
    expect(meter).toHaveAttribute(
      "aria-describedby",
      `${helperText.id} ${thresholdsText.id}`,
    );
  });

  it("uses a custom thresholdsText function", () => {
    render(Meter);

    const el = screen.getByTestId("custom-thresholds-text");
    const meter = within(el).getByRole("meter");
    const text = within(el).getByText("Custom: 700/900");
    expect(meter).toHaveAttribute("aria-describedby", text.id);
  });

  it.each([["thresholds-no-show"], ["empty-thresholds-text"]])(
    "omits the threshold description for %s",
    (testId) => {
      render(Meter);

      const el = screen.getByTestId(testId);
      expect(within(el).getByRole("meter")).not.toHaveAttribute(
        "aria-describedby",
      );
      expect(within(el).queryByText(/warning at/i)).not.toBeInTheDocument();
    },
  );
});
