import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FluidDatePickerSkeleton from "./DatePicker.fluidSkeleton.test.svelte";
import DatePickerSkeleton from "./DatePickerSkeleton.test.svelte";

describe("DatePickerSkeleton", () => {
  it("renders the simple variant by default", () => {
    const { container } = render(DatePickerSkeleton);

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker", "bx--skeleton");
    expect(wrapper).toHaveClass("bx--date-picker--simple");
    expect(wrapper).not.toHaveClass("bx--date-picker--range");
    expect(wrapper).not.toHaveClass("bx--date-picker--short");

    expect(
      container.querySelectorAll(".bx--date-picker-container"),
    ).toHaveLength(1);
  });

  it("renders the range variant", () => {
    const { container } = render(DatePickerSkeleton, {
      props: { range: true },
    });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--range");
    expect(wrapper).not.toHaveClass("bx--date-picker--simple");

    expect(
      container.querySelectorAll(".bx--date-picker-container"),
    ).toHaveLength(2);
  });

  it("applies the short modifier independently of range", () => {
    const { container } = render(DatePickerSkeleton, {
      props: { short: true },
    });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--short");
    expect(wrapper).toHaveClass("bx--date-picker--simple");
    expect(wrapper).not.toHaveClass("bx--date-picker--range");
  });

  it("supports short combined with range", () => {
    const { container } = render(DatePickerSkeleton, {
      props: { range: true, short: true },
    });

    const wrapper = container.querySelector(".bx--date-picker");
    expect(wrapper).toHaveClass("bx--date-picker--range");
    expect(wrapper).toHaveClass("bx--date-picker--short");
    expect(wrapper).not.toHaveClass("bx--date-picker--simple");
  });

  it("renders decorative span labels in range mode", () => {
    const { container } = render(DatePickerSkeleton, {
      props: { range: true },
    });

    expect(container.querySelectorAll("label")).toHaveLength(0);
    expect(container.querySelectorAll("span.bx--label")).toHaveLength(2);
  });

  it("forwards mouse and click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(DatePickerSkeleton);

    const element = screen.getByTestId("date-picker-skeleton");

    await user.click(element);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(element);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("forwards additional attributes to the form item wrapper", () => {
    render(DatePickerSkeleton, {
      props: { "data-testid": "custom-skeleton", "aria-label": "Loading" },
    });

    const element = screen.getByTestId("custom-skeleton");
    expect(element).toHaveClass("bx--form-item");
    expect(element).toHaveAttribute("aria-label", "Loading");
  });
});

describe("FluidDatePickerSkeleton", () => {
  it("renders fluid skeleton state", () => {
    render(FluidDatePickerSkeleton);

    const skeleton = screen.getByTestId("fluid-date-picker-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass(
      "bx--form-item",
      "bx--date-picker--fluid__skeleton",
    );
    expect(skeleton).not.toHaveClass("bx--date-picker--fluid__skeleton--range");

    const containers = skeleton.querySelectorAll(
      ".bx--date-picker--fluid__skeleton--container",
    );
    expect(containers).toHaveLength(1);
    expect(
      containers[0].querySelector("span.bx--label.bx--skeleton"),
    ).toBeInTheDocument();
    expect(
      containers[0].querySelector("div.bx--skeleton.bx--text-input"),
    ).toBeInTheDocument();
  });

  it("renders the range variant with two containers", () => {
    render(FluidDatePickerSkeleton, { props: { range: true } });

    const skeleton = screen.getByTestId("fluid-date-picker-skeleton");
    expect(skeleton).toHaveClass("bx--date-picker--fluid__skeleton--range");
    expect(
      skeleton.querySelectorAll(".bx--date-picker--fluid__skeleton--container"),
    ).toHaveLength(2);
  });
});
