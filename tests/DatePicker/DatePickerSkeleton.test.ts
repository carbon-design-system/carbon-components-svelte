import { render, screen } from "@testing-library/svelte";
import DatePickerSkeletonComponent from "carbon-components-svelte/DatePicker/DatePickerSkeleton.svelte";
import FluidDatePickerSkeleton from "carbon-components-svelte/DatePicker/FluidDatePickerSkeleton.svelte";
import { user } from "../utils/user";
import DatePickerSkeletonInForm from "./DatePickerSkeleton.form.test.svelte";
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

  it.each(["xs", "sm", "xl"] as const)(
    "sizes every input with the %s modifier",
    (size) => {
      const { container } = render(DatePickerSkeletonComponent, {
        props: { range: true, size },
      });

      const inputs = container.querySelectorAll(".bx--date-picker__input");
      expect(inputs).toHaveLength(2);
      for (const input of inputs) {
        expect(input).toHaveClass(`bx--date-picker__input--${size}`);
      }
    },
  );

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

  it.each([
    ["single", 1],
    ["month", 1],
    ["range", 2],
  ] as const)(
    "renders datePickerType %s regardless of range",
    (datePickerType, containers) => {
      const { container } = render(DatePickerSkeleton, {
        props: { datePickerType, range: datePickerType !== "range" },
      });

      const wrapper = container.querySelector(".bx--date-picker");
      expect(wrapper).toHaveClass(
        datePickerType === "range"
          ? "bx--date-picker--range"
          : "bx--date-picker--single",
      );
      expect(
        container.querySelectorAll(".bx--date-picker-container"),
      ).toHaveLength(containers);
    },
  );

  it("inherits the size of a parent Form", () => {
    render(DatePickerSkeletonInForm, { props: { size: "sm" } });

    expect(
      screen.getByTestId("skeleton").querySelector(".bx--date-picker__input"),
    ).toHaveClass("bx--date-picker__input--sm");
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

  it("renders decorative span labels in range mode", () => {
    const { container } = render(DatePickerSkeleton, {
      props: { range: true },
    });

    expect(container.querySelectorAll("label")).toHaveLength(0);
    expect(container.querySelectorAll("span.bx--label")).toHaveLength(2);
  });

  it("forwards mouse and click events", async () => {
    const onclick = vi.fn();
    const onmouseover = vi.fn();
    const onmouseleave = vi.fn();
    render(DatePickerSkeleton, {
      props: { onclick, onmouseover, onmouseleave },
    });

    const element = screen.getByTestId("date-picker-skeleton");

    await user.click(element);
    expect(onclick).toHaveBeenCalled();

    await user.hover(element);
    expect(onmouseover).toHaveBeenCalled();

    await user.unhover(element);
    expect(onmouseleave).toHaveBeenCalled();
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
    render(FluidDatePickerSkeleton, {
      props: { "data-testid": "fluid-date-picker-skeleton" },
    });

    const skeleton = screen.getByTestId("fluid-date-picker-skeleton");
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
    render(FluidDatePickerSkeleton, {
      props: { range: true, "data-testid": "fluid-date-picker-skeleton" },
    });

    const skeleton = screen.getByTestId("fluid-date-picker-skeleton");
    expect(skeleton).toHaveClass("bx--date-picker--fluid__skeleton--range");
    expect(
      skeleton.querySelectorAll(".bx--date-picker--fluid__skeleton--container"),
    ).toHaveLength(2);
  });
});
