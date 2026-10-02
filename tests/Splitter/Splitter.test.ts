import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Splitter from "./Splitter.test.svelte";

function mockRect(element: HTMLElement) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: 0,
    right: 400,
    width: 400,
    top: 0,
    bottom: 200,
    height: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

function setup(props: Record<string, unknown> = {}) {
  const consoleLog = vi.spyOn(console, "log");
  render(Splitter, { props });
  const root = screen.getByTestId("splitter");
  mockRect(root);
  const separator = screen.getByRole("separator");
  const startPane = screen.getByText("Start pane").parentElement;
  assert(startPane);
  return { consoleLog, root, separator, startPane };
}

describe("Splitter", () => {
  it("renders both panes and a focusable separator controlling the start pane", () => {
    const { separator, startPane } = setup();

    expect(screen.getByText("End pane")).toBeInTheDocument();
    expect(separator).toHaveAttribute("tabindex", "0");
    expect(separator).toHaveAttribute("aria-label", "Resize panes");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-valuenow", "50");
    expect(separator).toHaveAttribute("aria-valuemin", "0");
    expect(separator).toHaveAttribute("aria-valuemax", "100");
    expect(separator).toHaveAttribute("aria-controls", startPane.id);
    expect(startPane.style.flexBasis).toBe("50%");
  });

  it("renders size clamped to min and max without rewriting it", () => {
    const { separator, startPane } = setup({ size: 95, max: 80 });

    expect(separator).toHaveAttribute("aria-valuenow", "80");
    expect(startPane.style.flexBasis).toBe("80%");
    expect(screen.getByTestId("bound-size")).toHaveTextContent("95");
  });

  it.each([
    { keys: "{ArrowRight}", expected: "51" },
    { keys: "{ArrowLeft}", expected: "49" },
    { keys: "{Shift>}{ArrowRight}{/Shift}", expected: "60" },
    { keys: "{Home}", expected: "20" },
    { keys: "{End}", expected: "90" },
    { keys: "{ArrowUp}", expected: "50" },
  ])("moves with $keys to $expected", async ({ keys, expected }) => {
    const { separator } = setup({ min: 20, max: 90 });

    separator.focus();
    await user.keyboard(keys);

    expect(separator).toHaveAttribute("aria-valuenow", expected);
    expect(screen.getByTestId("bound-size")).toHaveTextContent(expected);
  });

  it("uses ArrowUp and ArrowDown when vertical", async () => {
    const { separator, root } = setup({ orientation: "vertical" });

    expect(root).toHaveClass("bx--splitter--vertical");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");

    separator.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowLeft}");

    expect(separator).toHaveAttribute("aria-valuenow", "51");
  });

  it("collapses to min on Enter and restores the previous size", async () => {
    const { consoleLog, separator } = setup({ size: 40, min: 10 });

    separator.focus();
    await user.keyboard("{Enter}");
    expect(separator).toHaveAttribute("aria-valuenow", "10");

    await user.keyboard("{Enter}");
    expect(separator).toHaveAttribute("aria-valuenow", "40");
    expect(consoleLog.mock.calls).toEqual([
      ["resize", { size: 10 }],
      ["resize", { size: 40 }],
    ]);
  });

  it("follows a pointer drag and fires resize once on release", async () => {
    const { consoleLog, root, separator } = setup();

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    expect(separator).toHaveFocus();
    expect(root).toHaveClass("bx--splitter--resizing");

    await fireEvent.pointerMove(separator, { clientX: 100, pointerId: 1 });
    expect(separator).toHaveAttribute("aria-valuenow", "25");
    await fireEvent.pointerMove(separator, { clientX: 133, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "33.25");
    expect(root).not.toHaveClass("bx--splitter--resizing");
    expect(consoleLog.mock.calls).toEqual([["resize", { size: 33.25 }]]);
  });

  it("measures a vertical drag along the height", async () => {
    const { separator } = setup({ orientation: "vertical" });

    await fireEvent.pointerDown(separator, { clientY: 100, pointerId: 1 });
    await fireEvent.pointerMove(separator, { clientY: 150, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "75");
  });

  it("clamps a drag to min and max", async () => {
    const { separator } = setup({ min: 10, max: 70 });

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerMove(separator, { clientX: 0, pointerId: 1 });
    expect(separator).toHaveAttribute("aria-valuenow", "10");
    await fireEvent.pointerMove(separator, { clientX: 400, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "70");
  });

  it("does not fire resize for a press without movement", async () => {
    const { consoleLog, separator } = setup();

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("restores the initial size on double click", async () => {
    const { consoleLog, separator } = setup({ size: 30 });

    separator.focus();
    await user.keyboard("{End}");
    await user.dblClick(separator);

    expect(separator).toHaveAttribute("aria-valuenow", "30");
    expect(consoleLog).toHaveBeenLastCalledWith("resize", { size: 30 });
  });

  it("ignores drags and keys when disabled", async () => {
    const { consoleLog, separator } = setup({ disabled: true });

    expect(separator).not.toHaveAttribute("tabindex");
    expect(separator).not.toHaveAttribute("aria-valuenow");
    expect(separator).toHaveClass("bx--splitter__separator--disabled");

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerMove(separator, { clientX: 100, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });
    await fireEvent.keyDown(separator, { key: "ArrowRight" });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(screen.getByTestId("bound-size")).toHaveTextContent("50");
  });

  it("supports a custom separator label", () => {
    setup({ separatorLabel: "Resize file tree" });

    expect(
      screen.getByRole("separator", { name: "Resize file tree" }),
    ).toBeInTheDocument();
  });
});
