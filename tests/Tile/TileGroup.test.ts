import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TileGroup from "./TileGroup.test.svelte";

describe("TileGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(TileGroup);

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--tile-group");
    expect(fieldset).not.toBeDisabled();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
  });

  it("should render with legend", () => {
    render(TileGroup, { props: { legend: "Select an option" } });

    expect(screen.getByText("Select an option")).toBeInTheDocument();
    expect(screen.getByText("Select an option")).toHaveClass("bx--label");
  });

  it("should handle disabled state", () => {
    render(TileGroup, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }
  });

  it("should handle required state", () => {
    render(TileGroup, { props: { required: true } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeRequired();
    }
  });

  it("should handle custom name", () => {
    render(TileGroup, { props: { name: "custom-group" } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toHaveAttribute("name", "custom-group");
    }
  });

  it("should handle initial selected value", () => {
    render(TileGroup, { props: { selected: "option2" } });

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
    expect(radios[2]).not.toBeChecked();
  });

  it("should handle select event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TileGroup);

    const radios = screen.getAllByRole("radio");
    await user.click(radios[1]);

    expect(consoleLog).toHaveBeenCalledWith("select", "option2");
    expect(radios[1]).toBeChecked();
  });

  it("should update selected value on radio change", async () => {
    const { component } = render(TileGroup);

    const radios = screen.getAllByRole("radio");

    await user.click(radios[0]);
    expect(component.selected).toBe("option1");

    await user.click(radios[2]);
    expect(component.selected).toBe("option3");
  });

  it("should apply custom class", () => {
    render(TileGroup, { props: { customClass: "custom-tile-group" } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("custom-tile-group");
  });

  it("should handle programmatic selected value changes", async () => {
    const { component } = render(TileGroup);

    component.selected = "option2";
    await new Promise((resolve) => setTimeout(resolve, 0));

    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toBeChecked();

    component.selected = "option3";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(radios[2]).toBeChecked();
  });

  it("should not dispatch select event on initial render", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TileGroup, { props: { selected: "option1" } });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should handle keyboard navigation", async () => {
    render(TileGroup);

    const radios = screen.getAllByRole("radio");

    await user.tab();
    expect(radios[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(radios[0]).toHaveFocus();
    expect(radios[0]).toBeChecked();
  });

  it("should handle arrow up navigation", async () => {
    render(TileGroup);

    const radios = screen.getAllByRole("radio");

    await user.tab();
    expect(radios[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toBeChecked();
  });

  it("should render without legend when not provided", () => {
    render(TileGroup);

    const legend = screen.queryByRole("legend");
    expect(legend).not.toBeInTheDocument();
  });
});
