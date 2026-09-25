import { render, screen } from "@testing-library/svelte";
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

  it("supports custom description", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-description");

    const title = wrapper.querySelector("title");
    expect(title).toHaveTextContent("Processing data...");
  });

  it("renders with correct spinner radius", () => {
    render(Loading);

    const defaultWrapper = screen.getByTestId("default-loader");
    const defaultStroke = defaultWrapper.querySelector(".bx--loading__stroke");
    expect(defaultStroke).toHaveAttribute("r", "44");

    const smallWrapper = screen.getByTestId("loader-small");
    const smallStroke = smallWrapper.querySelector(".bx--loading__stroke");
    expect(smallStroke).toHaveAttribute("r", "42");
  });

  describe("delay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not render the spinner until the delay elapses", async () => {
      const { getByTestId } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      expect(wrapper.querySelector(".bx--loading")).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(200);

      expect(wrapper.querySelector(".bx--loading")).toBeInTheDocument();
    });

    it("cancels the pending spinner when active becomes false before the delay elapses", async () => {
      const { getByTestId, rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      await vi.advanceTimersByTimeAsync(100);
      await rerender({ active: false, delay: 200 });
      await vi.advanceTimersByTimeAsync(200);

      expect(wrapper.querySelector(".bx--loading")).not.toBeInTheDocument();
    });

    it("keeps the spinner visible with the stop animation when active becomes false after it appeared", async () => {
      const { getByTestId, rerender } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });
      const wrapper = getByTestId("delayed");

      await vi.advanceTimersByTimeAsync(200);
      await rerender({ active: false, delay: 200 });

      const loader = wrapper.querySelector(".bx--loading");
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass("bx--loading--stop");
    });

    it("renders synchronously when delay is 0", () => {
      const { getByTestId } = render(LoadingDelay, {
        props: { active: true, delay: 0 },
      });
      const wrapper = getByTestId("delayed");

      expect(wrapper.querySelector(".bx--loading")).toBeInTheDocument();
    });

    it("does not throw when unmounted during the delay", () => {
      const { unmount } = render(LoadingDelay, {
        props: { active: true, delay: 200 },
      });

      unmount();

      expect(() => vi.advanceTimersByTime(200)).not.toThrow();
    });
  });
});
