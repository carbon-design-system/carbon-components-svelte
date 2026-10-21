import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import InlineLoading from "./InlineLoading.test.svelte";
import InlineLoadingDelay from "./InlineLoadingDelay.test.svelte";
import InlineLoadingRerender from "./InlineLoadingRerender.test.svelte";
import InlineLoadingTransition from "./InlineLoadingTransition.test.svelte";

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

  it("maps error status to an assertive alert live region", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-error");

    const region = wrapper.querySelector(".bx--inline-loading");
    expect(region).toHaveAttribute("role", "alert");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("maps non-error statuses to a polite status live region", () => {
    render(InlineLoading);

    for (const testId of ["loader-active", "loader-finished"]) {
      const wrapper = screen.getByTestId(testId);
      const region = wrapper.querySelector(".bx--inline-loading");
      expect(region).toHaveAttribute("role", "status");
      expect(region).toHaveAttribute("aria-live", "polite");
    }
  });

  it("lets a passed-through role override the status-derived default", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-role-override");

    expect(wrapper.querySelector(".bx--inline-loading")).toHaveAttribute(
      "role",
      "none",
    );
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

  it("keeps the success timer when the child re-renders while finished", async () => {
    const onSuccess = vi.fn();
    const { rerender } = render(InlineLoadingRerender, {
      props: { tick: 0, onSuccess },
    });

    vi.advanceTimersByTime(1000);
    await rerender({ tick: 1 });
    expect(
      screen.getByText("Render 1", { selector: ".bx--inline-loading__text" }),
    ).toBeInTheDocument();
    await rerender({ tick: 2 });
    vi.advanceTimersByTime(500);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3000);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("dispatches success when status transitions to finished after mount", async () => {
    const onSuccess = vi.fn();
    const { component } = render(InlineLoadingTransition, {
      props: { status: "active", onSuccess },
    });

    vi.advanceTimersByTime(1500);
    expect(onSuccess).not.toHaveBeenCalled();

    component.status = "finished";
    await tick();
    vi.advanceTimersByTime(1500);

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // Regression: re-entering finished must arm a fresh success timer
  it("re-arms success on each transition back into finished", async () => {
    const onSuccess = vi.fn();
    const { component } = render(InlineLoadingTransition, {
      props: { status: "active", onSuccess },
    });

    component.status = "finished";
    await tick();
    vi.advanceTimersByTime(1500);
    expect(onSuccess).toHaveBeenCalledTimes(1);

    component.status = "active";
    await tick();
    component.status = "finished";
    await tick();
    vi.advanceTimersByTime(1500);

    expect(onSuccess).toHaveBeenCalledTimes(2);
  });

  it("does not dispatch success when status leaves finished before the delay", async () => {
    const onSuccess = vi.fn();
    const { component } = render(InlineLoadingTransition, {
      props: { status: "finished", onSuccess },
    });

    vi.advanceTimersByTime(500);
    component.status = "error";
    await tick();
    vi.advanceTimersByTime(2000);

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("dispatches success when mounted finished with no delay", async () => {
    const onSuccess = vi.fn();
    render(InlineLoadingTransition, {
      props: { status: "finished", successDelay: 0, onSuccess },
    });
    await tick();

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("supports custom success delay", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(InlineLoading);

    vi.advanceTimersByTime(400);
    expect(consoleLog).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(consoleLog).toHaveBeenCalledWith("success custom delay");
  });

  it("does not dispatch success when unmounted before the delay", () => {
    const onSuccess = vi.fn();
    const { unmount } = render(InlineLoadingTransition, {
      props: { status: "finished", onSuccess },
    });
    vi.advanceTimersByTime(500);
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    vi.advanceTimersByTime(2000);

    expect(vi.getTimerCount()).toBe(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  describe("delay", () => {
    it("does not render until the delay elapses while active", async () => {
      const { getByTestId } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      expect(
        wrapper.querySelector(".bx--inline-loading"),
      ).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(200);

      expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
    });

    it("renders immediately when status leaves active before the delay elapses", async () => {
      const { getByTestId, rerender } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      await vi.advanceTimersByTimeAsync(100);
      await rerender({ status: "finished", delay: 200 });

      expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
      expect(
        wrapper.querySelector(".bx--inline-loading__checkmark-container"),
      ).toBeInTheDocument();
    });

    it("renders synchronously when delay is 0", () => {
      const { getByTestId } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 0 },
      });
      const wrapper = getByTestId("delayed");

      expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
    });

    // Regression: a resting status renders immediately, but re-entering
    // "active" from that resting state must still honor the delay rather
    // than inheriting the already-true visibility.
    it("re-hides when re-entering active from a resting status", async () => {
      const { getByTestId, rerender } = render(InlineLoadingDelay, {
        props: { status: "inactive", delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();

      await rerender({ status: "active", delay: 200 });

      expect(
        wrapper.querySelector(".bx--inline-loading"),
      ).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(200);

      expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
    });

    it("renders immediately when mounted inactive", () => {
      const { getByTestId } = render(InlineLoadingDelay, {
        props: { status: "inactive", delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
    });

    it("renders immediately when mounted in the error state", () => {
      const { getByTestId } = render(InlineLoadingDelay, {
        props: { status: "error", delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      const region = wrapper.querySelector(".bx--inline-loading");
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute("role", "alert");
    });

    it("clears the pending timer when unmounted during the delay", () => {
      const { unmount } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200 },
      });
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
