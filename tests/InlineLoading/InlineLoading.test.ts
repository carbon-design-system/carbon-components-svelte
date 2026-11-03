import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import InlineLoading from "./InlineLoading.test.svelte";
import InlineLoadingDelay from "./InlineLoadingDelay.test.svelte";
import InlineLoadingEvents from "./InlineLoadingEvents.test.svelte";
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

  it("renders with description", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-with-description");

    expect(wrapper.querySelector(".bx--inline-loading")).toBeInTheDocument();
    expect(wrapper.querySelector(".bx--loading")).toBeInTheDocument();
    const description = wrapper.querySelector(".bx--inline-loading__text");
    expect(description).toHaveTextContent("Loading metrics...");
  });

  it("supports active state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-active");

    expect(wrapper.querySelector(".bx--loading")).toHaveClass(
      "bx--loading--small",
    );
  });

  it("supports inactive state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-inactive");

    expect(wrapper.querySelector(".bx--loading")).toHaveClass(
      "bx--loading--small",
    );
    expect(wrapper.querySelector(".bx--loading--stop")).toBeInTheDocument();
  });

  it("supports finished state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-finished");

    expect(
      wrapper.querySelector(".bx--inline-loading__checkmark-container"),
    ).toBeInTheDocument();
  });

  it("supports error state", () => {
    render(InlineLoading);
    const wrapper = screen.getByTestId("loader-error");

    expect(
      wrapper.querySelector(".bx--inline-loading--error"),
    ).toBeInTheDocument();
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

  it.each([
    ["loader-finished", "finished"],
    ["loader-error", "error"],
  ])("titles the %s icon with its status by default", (testId, title) => {
    render(InlineLoading);

    expect(screen.getByTestId(testId).querySelector("title")).toHaveTextContent(
      title,
    );
  });

  it("passes iconDescription to the active spinner as its title", () => {
    render(InlineLoading);

    expect(
      screen.getByTestId("loader-active-icon").querySelector("title"),
    ).toHaveTextContent("Saving data");
  });

  it.each([
    ["click", (el: Element) => fireEvent.click(el)],
    ["mouseover", (el: Element) => fireEvent.mouseOver(el)],
    ["mouseenter", (el: Element) => fireEvent.mouseEnter(el)],
    ["mouseleave", (el: Element) => fireEvent.mouseLeave(el)],
  ])("forwards %s", async (type, fire) => {
    const onEvent = vi.fn();
    render(InlineLoadingEvents, { props: { onEvent } });

    await fire(screen.getByTestId("events"));

    expect(onEvent).toHaveBeenCalledExactlyOnceWith(type);
  });

  it("dispatches success event after delay when finished", () => {
    const onSuccess = vi.fn();
    render(InlineLoading, { props: { onSuccess } });

    const wrapper = screen.getByTestId("loader-finished");
    expect(
      wrapper.querySelector(".bx--inline-loading__checkmark-container"),
    ).toBeInTheDocument();

    vi.advanceTimersByTime(1500);
    expect(onSuccess).toHaveBeenCalledTimes(1);
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
    const onCustomDelaySuccess = vi.fn();
    render(InlineLoading, { props: { onCustomDelaySuccess } });

    vi.advanceTimersByTime(400);
    expect(onCustomDelaySuccess).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onCustomDelaySuccess).toHaveBeenCalledTimes(1);
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
    function getStatus() {
      return screen.getByTestId("delayed").querySelector(".bx--inline-loading");
    }

    it("renders a waiting spinner hidden until the delay elapses", async () => {
      render(InlineLoadingDelay, {
        props: { status: "active", delay: 200, description: "Saving" },
      });
      const container = getStatus();

      expect(container).toHaveClass("bx--inline-loading--delayed");
      expect(container).toHaveStyle({ animationDuration: "200ms" });
      expect(container?.querySelector(".bx--loading")).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(199);
      expect(getStatus()).toHaveClass("bx--inline-loading--delayed");

      await vi.advanceTimersByTimeAsync(1);
      expect(getStatus()).toBe(container);
      expect(container).not.toHaveClass("bx--inline-loading--delayed");
    });

    it("shows the result at once when work ends within the delay", async () => {
      const { rerender } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200, description: "Saving" },
      });

      await vi.advanceTimersByTimeAsync(100);
      await rerender({ status: "finished", delay: 200, description: "Saved" });

      expect(getStatus()).not.toHaveClass("bx--inline-loading--delayed");
      expect(
        getStatus()?.querySelector(".bx--inline-loading__checkmark-container"),
      ).toBeInTheDocument();
      expect(getStatus()).toHaveTextContent("Saved");
    });

    it("holds a shown spinner and its text for the minimum before the result", async () => {
      const onSuccess = vi.fn();
      const { rerender } = render(InlineLoadingDelay, {
        props: {
          status: "active",
          delay: 200,
          description: "Saving",
          onSuccess,
        },
      });

      await vi.advanceTimersByTimeAsync(300);
      await rerender({
        status: "finished",
        delay: 200,
        description: "Saved",
        onSuccess,
      });
      expect(getStatus()?.querySelector(".bx--loading")).toBeInTheDocument();
      expect(getStatus()).toHaveTextContent("Saving");

      // Shown at 200 ms, so the 500 ms minimum ends at 700 ms.
      await vi.advanceTimersByTimeAsync(399);
      expect(getStatus()?.querySelector(".bx--loading")).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(1);
      expect(
        getStatus()?.querySelector(".bx--inline-loading__checkmark-container"),
      ).toBeInTheDocument();
      expect(getStatus()).toHaveTextContent("Saved");

      // `success` waits `successDelay` from when the checkmark shows.
      await vi.advanceTimersByTimeAsync(999);
      expect(onSuccess).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("holds the spinner before an error too", async () => {
      const { rerender } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(300);
      await rerender({ status: "error", delay: 200 });
      expect(getStatus()).toHaveAttribute("role", "status");

      await vi.advanceTimersByTimeAsync(400);
      expect(getStatus()).toHaveAttribute("role", "alert");
    });

    it("shows the result at once when the work outlasts the minimum", async () => {
      const { rerender } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(1000);
      await rerender({ status: "finished", delay: 200 });

      expect(
        getStatus()?.querySelector(".bx--inline-loading__checkmark-container"),
      ).toBeInTheDocument();
    });

    // Regression: a resting status renders immediately, but re-entering
    // "active" from that resting state must still honor the delay rather
    // than inheriting the already-true visibility.
    it("waits again when re-entering active from a resting status", async () => {
      const { rerender } = render(InlineLoadingDelay, {
        props: { status: "inactive", delay: 200 },
      });
      expect(getStatus()).not.toHaveClass("bx--inline-loading--delayed");

      await rerender({ status: "active", delay: 200 });
      expect(getStatus()).toHaveClass("bx--inline-loading--delayed");

      await vi.advanceTimersByTimeAsync(200);
      expect(getStatus()).not.toHaveClass("bx--inline-loading--delayed");
    });

    it("does not restart the delay when the description changes", async () => {
      const { rerender } = render(InlineLoadingDelay, {
        props: { status: "active", delay: 200, description: "Saving" },
      });

      await vi.advanceTimersByTimeAsync(150);
      await rerender({ status: "active", delay: 200, description: "Saving 2" });
      await vi.advanceTimersByTimeAsync(50);

      expect(getStatus()).not.toHaveClass("bx--inline-loading--delayed");
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
