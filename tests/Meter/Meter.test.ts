import { render, screen, within } from "@testing-library/svelte";
// svelte-check's Svelte 4 compat pass can't resolve this fixture's
// declaration file, for reasons independent of file content (reproduces
// even for a trivial one-line fixture unrelated to Meter). @ts-expect-error
// would itself fail under Svelte 5, where this import has no real error.
// biome-ignore lint/suspicious/noTsIgnore: see comment above
// @ts-ignore
import Meter from "./Meter.test.svelte";
// biome-ignore lint/suspicious/noTsIgnore: see comment above
// @ts-ignore
import MeterStatus from "./MeterStatus.test.svelte";

describe("Meter", () => {
  it("renders ARIA min/max/now", () => {
    render(Meter);

    const meter = within(screen.getByTestId("basic")).getByRole("meter", {
      name: "Storage",
    });
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

  it("derives warning status from thresholds", () => {
    render(Meter);

    const el = screen.getByTestId("warning");
    expect(el).toHaveClass("bx--meter--warning");
    expect(el).not.toHaveClass("bx--meter--error");
  });

  it("derives error status from thresholds", () => {
    render(Meter);

    const el = screen.getByTestId("error");
    expect(el).toHaveClass("bx--meter--error");
  });

  it("derives no status below thresholds", () => {
    render(Meter);

    const el = screen.getByTestId("neither");
    expect(el).not.toHaveClass("bx--meter--warning");
    expect(el).not.toHaveClass("bx--meter--error");
  });

  it("lets explicit status override thresholds", () => {
    render(Meter);

    const el = screen.getByTestId("explicit-success");
    expect(el).toHaveClass("bx--meter--success");
    expect(el).not.toHaveClass("bx--meter--error");
  });

  it("caps aria-valuenow and marks over-capacity when value exceeds max", () => {
    render(Meter);

    const el = screen.getByTestId("over-capacity");
    const meter = within(el).getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "1000");
    expect(el).toHaveClass("bx--meter--over");
    expect(el).toHaveClass("bx--meter--error");
  });

  it("clamps aria-valuenow to zero when value is negative", () => {
    render(Meter);

    const el = screen.getByTestId("negative-value");
    const meter = within(el).getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "0");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
  });

  it("clamps aria-valuenow to zero when value is NaN", () => {
    render(Meter);

    const el = screen.getByTestId("nan-value");
    const meter = within(el).getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "0");
  });

  it("visually hides only the label text when hideLabel is set", () => {
    render(Meter);

    const el = screen.getByTestId("hidden-label");
    expect(el.querySelector(".bx--meter__label-text")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(
      within(el).getByRole("meter", { name: "Storage" }),
    ).toBeInTheDocument();
  });

  it("links helper text via aria-describedby", () => {
    render(Meter);

    const el = screen.getByTestId("helper-text");
    const meter = within(el).getByRole("meter");
    const helperText = screen.getByText("Approaching limit");
    expect(meter).toHaveAttribute("aria-describedby", helperText.id);
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

    const getAnnouncement = () =>
      screen
        .getByTestId("status")
        .querySelector(".bx--visually-hidden")
        ?.textContent?.trim();

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

  it("stays quiet when a meter mounts already in error", () => {
    render(MeterStatus, { props: { value: 10, status: "error" } });

    const announcement = screen
      .getByTestId("status")
      .querySelector(".bx--visually-hidden")
      ?.textContent?.trim();
    expect(announcement).toBe("");
  });

  it("announces a custom errorText on transition to error", async () => {
    const { rerender } = render(MeterStatus, {
      props: { value: 10, errorText: "Critical" },
    });

    const getAnnouncement = () =>
      screen
        .getByTestId("status")
        .querySelector(".bx--visually-hidden")
        ?.textContent?.trim();

    expect(getAnnouncement()).toBe("");

    await rerender({ value: 10, status: "error", errorText: "Critical" });
    expect(getAnnouncement()).toBe("Critical");
  });
});
