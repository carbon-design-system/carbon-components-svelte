import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import Loading from "./Loading.test.svelte";
import LoadingDelay from "./LoadingDelay.test.svelte";

describe("Loading", () => {
  it("renders with default props", () => {
    render(Loading);
    const wrapper = screen.getByTestId("default-loader");

    expect(wrapper.querySelector(".bx--loading-overlay")).toBeInTheDocument();

    const loader = wrapper.querySelector(".bx--loading");
    expect(loader).toBeInTheDocument();
    expect(loader).not.toHaveClass("bx--loading--stop");

    expect(loader).toHaveAttribute("aria-atomic", "true");
    expect(loader).toHaveAttribute("aria-live", "assertive");

    expect(wrapper.querySelector(".bx--loading__stroke")).toHaveAttribute(
      "r",
      "44",
    );

    const title = wrapper.querySelector("title");
    expect(title).toHaveTextContent("loading");
  });

  it("renders without overlay", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-no-overlay");

    expect(
      wrapper.querySelector(".bx--loading-overlay"),
    ).not.toBeInTheDocument();

    expect(wrapper.querySelector(".bx--loading")).toBeInTheDocument();
  });

  it("supports small variant", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-small");

    const loader = wrapper.querySelector(".bx--loading");
    expect(loader).toHaveClass("bx--loading--small");

    const backgroundCircle = wrapper.querySelector(".bx--loading__background");
    expect(backgroundCircle).toBeInTheDocument();
    expect(backgroundCircle).toHaveAttribute("r", "42");

    const strokeCircle = wrapper.querySelector(".bx--loading__stroke");
    expect(strokeCircle).toHaveAttribute("r", "42");
  });

  it("supports inactive state", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-inactive");

    const overlay = wrapper.querySelector(".bx--loading-overlay");
    expect(overlay).toHaveClass("bx--loading-overlay--stop");

    const loader = wrapper.querySelector(".bx--loading");
    expect(loader).toHaveClass("bx--loading--stop");

    expect(loader).toHaveAttribute("aria-live", "off");
  });

  it("passes rest props to the overlay", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-rest");

    const overlay = wrapper.querySelector(".bx--loading-overlay");
    expect(overlay).toHaveAttribute("id", "rest-overlay");
    expect(overlay).toHaveAttribute("data-extra", "yes");
  });

  it("turns off aria-live without an overlay when inactive", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-no-overlay-inactive");

    expect(wrapper.querySelector(".bx--loading")).toHaveAttribute(
      "aria-live",
      "off",
    );
  });

  it("supports custom description", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-description");

    const title = wrapper.querySelector("title");
    expect(title).toHaveTextContent("Processing data...");
  });

  describe("delay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function getSpinner() {
      return screen.getByTestId("delayed").querySelector(".bx--loading");
    }

    it("renders a waiting spinner hidden until the delay elapses", async () => {
      render(LoadingDelay, { props: { active: true, delay: 200 } });
      const spinner = getSpinner();

      expect(spinner).toHaveClass("bx--loading--delayed");
      expect(spinner?.querySelector("svg")).toHaveStyle({
        animationDuration: "200ms",
      });

      await vi.advanceTimersByTimeAsync(199);
      expect(getSpinner()).toHaveClass("bx--loading--delayed");

      await vi.advanceTimersByTimeAsync(1);
      expect(getSpinner()).toBe(spinner);
      expect(spinner).not.toHaveClass("bx--loading--delayed");
      expect(spinner).not.toHaveClass("bx--loading--stop");
    });

    it("never shows a spinner for work that ends within the delay", async () => {
      const { rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(100);
      await rerender({ active: false, delay: 200 });
      expect(getSpinner()).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(1000);
      expect(getSpinner()).not.toBeInTheDocument();
    });

    it("waits the delay when active turns on after mount", async () => {
      const { rerender } = render(LoadingDelay, {
        props: { active: false, delay: 200 },
      });
      expect(getSpinner()).not.toBeInTheDocument();

      await rerender({ active: true, delay: 200 });
      expect(getSpinner()).toHaveClass("bx--loading--delayed");

      await vi.advanceTimersByTimeAsync(200);
      expect(getSpinner()).not.toHaveClass("bx--loading--delayed");
    });

    it("holds a shown spinner for the minimum, then plays the stop animation", async () => {
      const { rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(300);
      await rerender({ active: false, delay: 200 });
      expect(getSpinner()).not.toHaveClass("bx--loading--stop");
      expect(getSpinner()).toHaveAttribute("aria-live", "assertive");

      // Shown at 200 ms, so the 500 ms minimum ends at 700 ms.
      await vi.advanceTimersByTimeAsync(399);
      expect(getSpinner()).not.toHaveClass("bx--loading--stop");

      await vi.advanceTimersByTimeAsync(1);
      expect(getSpinner()).toHaveClass("bx--loading--stop");
      expect(getSpinner()).toHaveAttribute("aria-live", "off");
    });

    it("stops at once when the work outlasts the minimum", async () => {
      const { rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(1000);
      await rerender({ active: false, delay: 200 });

      expect(getSpinner()).toHaveClass("bx--loading--stop");
    });

    it("keeps the spinner up when work restarts inside the minimum", async () => {
      const { rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(300);
      await rerender({ active: false, delay: 200 });
      await vi.advanceTimersByTimeAsync(100);
      await rerender({ active: true, delay: 200 });
      await vi.advanceTimersByTimeAsync(1000);

      expect(getSpinner()).not.toHaveClass("bx--loading--stop");
      expect(getSpinner()).not.toHaveClass("bx--loading--delayed");
    });

    it("does not restart the delay when other props change", async () => {
      const { rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });

      await vi.advanceTimersByTimeAsync(150);
      await rerender({ active: true, delay: 200, description: "Saving" });
      await vi.advanceTimersByTimeAsync(50);

      expect(getSpinner()).not.toHaveClass("bx--loading--delayed");
    });

    it("follows active exactly with no delay", async () => {
      const { rerender } = render(LoadingDelay, { props: { active: true } });
      expect(getSpinner()).not.toHaveClass("bx--loading--delayed");

      await rerender({ active: false });
      expect(getSpinner()).toHaveClass("bx--loading--stop");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("moves focus into the overlay only once it shows", async () => {
      render(LoadingDelay, {
        props: { active: true, delay: 200, withOverlay: true },
      });
      const overlay = screen
        .getByTestId("delayed")
        .querySelector(".bx--loading-overlay");

      expect(overlay).toHaveClass("bx--loading-overlay--delayed");
      expect(overlay).toHaveStyle({ animationDuration: "200ms" });
      expect(overlay).not.toHaveFocus();

      await vi.advanceTimersByTimeAsync(200);
      await tick();

      expect(overlay).not.toHaveClass("bx--loading-overlay--delayed");
      expect(overlay).toHaveFocus();
    });

    it("clears the pending timer when unmounted during the delay", () => {
      const { unmount } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
