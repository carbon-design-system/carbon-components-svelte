import { render, screen, within } from "@testing-library/svelte";
import Meter from "./Meter.test.svelte";

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
});
