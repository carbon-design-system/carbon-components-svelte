import { render, screen } from "@testing-library/svelte";
import InlineLoading from "./InlineLoading.test.svelte";

describe("InlineLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders with default props", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("default-loader");

    expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
    expect(wrapper.querySelector(".bx--loading")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-with-description");

    const description = wrapper.querySelector(".bx--inline-loading__text");
    expect(description).toHaveTextContent("Loading metrics...");
  });

  it("supports active state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-active");

    expect(wrapper.querySelector(".bx--loading")).toHaveClass(
      "bx--loading--small",
    );
    expect(wrapper.querySelector(".bx--loading--small")).toBeVisible();
    expect(
      wrapper.querySelector(".bx--inline-loading__text"),
    ).toHaveTextContent("Submitting...");
  });

  it("supports inactive state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-inactive");

    expect(wrapper.querySelector(".bx--loading")).toHaveClass(
      "bx--loading--small",
    );
    expect(wrapper.querySelector(".bx--loading--stop")).toBeInTheDocument();
    expect(
      wrapper.querySelector(".bx--inline-loading__text"),
    ).toHaveTextContent("Cancelling...");
  });

  it("supports finished state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-finished");

    expect(
      wrapper.querySelector(".bx--inline-loading__checkmark-container"),
    ).toBeInTheDocument();
    expect(
      wrapper.querySelector(".bx--inline-loading__text"),
    ).toHaveTextContent("Success");
  });

  it("supports error state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-error");

    expect(
      wrapper.querySelector(".bx--inline-loading--error"),
    ).toBeInTheDocument();
    expect(
      wrapper.querySelector(".bx--inline-loading__text"),
    ).toHaveTextContent("An error occurred");
  });

  it("supports custom icon description", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-custom-icon");

    const icon = wrapper.querySelector(
      ".bx--inline-loading__checkmark-container",
    );
    assert(icon);
    expect(icon).toHaveTextContent("Operation completed successfully");
  });

  it("dispatches success event after delay when finished", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(InlineLoading);

    const wrapper = screen.getByTestId("loader-finished");
    expect(
      wrapper.querySelector(".bx--inline-loading__checkmark-container"),
    ).toBeInTheDocument();

    vi.advanceTimersByTime(1500);
    expect(consoleLog).toHaveBeenCalledWith("success");
  });

  it("supports custom success delay", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(InlineLoading);

    vi.advanceTimersByTime(400);
    expect(consoleLog).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(consoleLog).toHaveBeenCalledWith("success custom delay");
  });

  it("cleans up timeout on unmount", () => {
    const { unmount } = render(InlineLoading);
    const wrapper = screen.getByTestId("loader-finished");
    expect(wrapper).toBeInTheDocument();

    unmount();

    // Advance timers to ensure no lingering timeouts
    vi.advanceTimersByTime(2000);
    // If cleanup wasn't working, this would throw an error about setState after unmount
  });
});
