import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Select from "./Select.test.svelte";
import SelectGroup from "./Select.group.test.svelte";
import SelectSkeleton from "./Select.skeleton.test.svelte";
import SelectFalsy from "./Select.falsy.test.svelte";

describe("Select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(Select);

    const select = screen.getByTestId("select");
    expect(select).toBeInTheDocument();

    const label = select.querySelector("label");
    expect(label).toHaveTextContent("Select label");
    expect(label).not.toHaveClass("bx--visually-hidden");

    const selectElement = select.querySelector("select") as HTMLSelectElement;
    expect(selectElement).not.toBeDisabled();
    expect(selectElement).not.toHaveAttribute("aria-invalid");

    const options = selectElement.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue("option-1");
    expect(options[0]).toHaveTextContent("Option 1");
  });

  it("renders with selected value", () => {
    render(Select, { selected: "option-2" });

    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    expect(selectElement).toHaveValue("option-2");
  });

  it("emits events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Select);

    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    await user.selectOptions(selectElement, "option-2");

    expect(consoleLog).toHaveBeenCalledWith("change");
    expect(consoleLog).toHaveBeenCalledWith("input");
    expect(consoleLog).toHaveBeenCalledWith("update", "option-2");
    expect(consoleLog).toHaveBeenCalledTimes(3);
  });

  it("renders default size", () => {
    render(Select);
    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    expect(selectElement).not.toHaveClass("bx--select-input--sm");
    expect(selectElement).not.toHaveClass("bx--select-input--xl");
  });

  it("renders small size variant", () => {
    render(Select, { size: "sm" });
    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    expect(selectElement).toHaveClass("bx--select-input--sm");
    expect(selectElement).not.toHaveClass("bx--select-input--xl");
  });

  it("renders extra large size variant", () => {
    render(Select, { size: "xl" });
    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    expect(selectElement).not.toHaveClass("bx--select-input--sm");
    expect(selectElement).toHaveClass("bx--select-input--xl");
  });

  it("renders default variant", () => {
    render(Select);
    const selectWrapper = screen
      .getByTestId("select")
      .querySelector(".bx--select") as HTMLElement;
    expect(selectWrapper).not.toHaveClass("bx--select--inline");
  });

  it("renders inline variant", () => {
    render(Select, { inline: true });
    const selectWrapper = screen
      .getByTestId("select")
      .querySelector(".bx--select") as HTMLElement;
    expect(selectWrapper).toHaveClass("bx--select--inline");
  });

  it("renders default theme", () => {
    render(Select);
    const selectWrapper = screen
      .getByTestId("select")
      .querySelector(".bx--select") as HTMLElement;
    expect(selectWrapper).not.toHaveClass("bx--select--light");
  });

  it("renders light theme", () => {
    render(Select, { light: true });
    const selectWrapper = screen
      .getByTestId("select")
      .querySelector(".bx--select") as HTMLElement;
    expect(selectWrapper).toHaveClass("bx--select--light");
  });

  it("renders enabled by default", () => {
    render(Select);
    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    expect(selectElement).not.toBeDisabled();
  });

  it("renders disabled state", () => {
    render(Select, { disabled: true });
    const selectElement = screen
      .getByTestId("select")
      .querySelector("select") as HTMLSelectElement;
    expect(selectElement).toBeDisabled();
  });

  it("renders valid by default", () => {
    render(Select);
    const wrapper = screen.getByTestId("select");
    const selectElement = wrapper.querySelector("select") as HTMLSelectElement;
    const selectWrapper = wrapper.querySelector(".bx--select") as HTMLElement;

    expect(selectWrapper).not.toHaveClass("bx--select--invalid");
    expect(selectElement).not.toHaveAttribute("aria-invalid");
    expect(
      wrapper.querySelector(".bx--form-requirement"),
    ).not.toBeInTheDocument();
  });

  it("renders invalid state", () => {
    render(Select, {
      invalid: true,
      invalidText: "Invalid selection",
    });

    const wrapper = screen.getByTestId("select");
    const selectElement = wrapper.querySelector("select") as HTMLSelectElement;
    const selectWrapper = wrapper.querySelector(".bx--select") as HTMLElement;

    expect(selectWrapper).toHaveClass("bx--select--invalid");
    expect(selectElement).toHaveAttribute("aria-invalid", "true");
    expect(wrapper.querySelector(".bx--form-requirement")).toHaveTextContent(
      "Invalid selection",
    );
  });

  it("renders without warning by default", () => {
    render(Select);
    const wrapper = screen.getByTestId("select");
    const selectWrapper = wrapper.querySelector(".bx--select") as HTMLElement;

    expect(selectWrapper).not.toHaveClass("bx--select--warning");
    expect(
      wrapper.querySelector(".bx--form-requirement"),
    ).not.toBeInTheDocument();
  });

  it("renders warning state", () => {
    render(Select, {
      warn: true,
      warnText: "Warning message",
    });

    const wrapper = screen.getByTestId("select");
    const selectWrapper = wrapper.querySelector(".bx--select") as HTMLElement;
    expect(selectWrapper).toHaveClass("bx--select--warning");
    expect(wrapper.querySelector(".bx--form-requirement")).toHaveTextContent(
      "Warning message",
    );
  });

  it("renders without helper text by default", () => {
    render(Select);
    expect(
      screen.getByTestId("select").querySelector(".bx--form__helper-text"),
    ).not.toBeInTheDocument();
  });

  it("renders helper text when provided", () => {
    render(Select, { helperText: "Helper text" });
    const helperElement = screen
      .getByTestId("select")
      .querySelector(".bx--form__helper-text") as HTMLElement;
    expect(helperElement).toHaveTextContent("Helper text");
  });

  it("renders visible label by default", () => {
    render(Select);
    const label = screen
      .getByTestId("select")
      .querySelector("label") as HTMLElement;
    expect(label).not.toHaveClass("bx--visually-hidden");
  });

  it("renders with hidden label", () => {
    render(Select, { hideLabel: true });
    const label = screen
      .getByTestId("select")
      .querySelector("label") as HTMLElement;
    expect(label).toHaveClass("bx--visually-hidden");
  });

  it("renders with SelectItemGroup", () => {
    render(SelectGroup);

    const select = screen.getByTestId("select-group");
    const selectElement = select.querySelector("select") as HTMLSelectElement;
    const optgroups = selectElement.querySelectorAll("optgroup");

    expect(optgroups).toHaveLength(2);
    expect(optgroups[0]).toHaveAttribute("label", "Category 1");
    expect(optgroups[1]).toHaveAttribute("label", "Category 2");

    const options = selectElement.querySelectorAll("option");
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveAttribute("disabled");
    expect(options[0]).toHaveAttribute("hidden");
  });

  it("renders skeleton state", () => {
    render(SelectSkeleton);

    const skeleton = screen.getByTestId("select-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.children[0]).toHaveClass("bx--skeleton");
  });

  it("renders value if `text` is falsy", () => {
    render(SelectFalsy);

    expect(screen.getByLabelText("Falsy text")).toHaveValue("-1");
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });
});
