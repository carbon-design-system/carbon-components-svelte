import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChartSync from "./ChartSync.test.svelte";

const traffic = () => screen.getByRole("application", { name: "Traffic" });

describe("Chart syncId", () => {
  it("shows one crosshair across charts that share an id", async () => {
    const onhoverB = vi.fn();
    render(ChartSync, { onhoverB });

    traffic().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("ruler-a")).toBeInTheDocument();
    expect(screen.getByTestId("ruler-b")).toBeInTheDocument();
    expect(screen.queryByTestId("ruler-c")).toBeNull();
    expect(onhoverB).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 1 }),
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("ruler-a")).toBeNull();
    expect(screen.queryByTestId("ruler-b")).toBeNull();
  });

  it("leaves the channel when the id goes away", async () => {
    const { rerender } = render(ChartSync);

    // An empty id, because `undefined` would fall back to the fixture default.
    await rerender({ syncB: "" });
    traffic().focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("ruler-a")).toBeInTheDocument();
    expect(screen.queryByTestId("ruler-b")).toBeNull();
  });

  it("a follower's tooltip waits with the source's and shows with it", async () => {
    render(ChartSync);
    const svg = traffic();
    svg.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 400,
        height: 288,
        right: 400,
        bottom: 288,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // In and out before the delay: neither tooltip, on either chart.
    await fireEvent.pointerMove(svg, { clientX: 200, clientY: 100 });
    await wait(30);
    expect(screen.getByTestId("ruler-b")).toBeInTheDocument();
    expect(screen.queryByTestId("tooltip-a")).toBeNull();
    expect(screen.queryByTestId("tooltip-b")).toBeNull();
    await fireEvent.pointerLeave(svg);
    await wait(120);
    expect(screen.queryByTestId("tooltip-a")).toBeNull();
    expect(screen.queryByTestId("tooltip-b")).toBeNull();

    // A pointer that rests: both show once the source's delay has passed.
    await fireEvent.pointerMove(svg, { clientX: 200, clientY: 100 });
    await wait(30);
    expect(screen.queryByTestId("tooltip-b")).toBeNull();
    await wait(120);
    expect(screen.getByTestId("tooltip-a")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-b")).toBeInTheDocument();
  });

  it("shares a selection and a brush only when asked, and the follower selects the same x", async () => {
    const first = render(ChartSync);
    traffic().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(screen.getByTestId("selected-b")).toHaveTextContent("");
    first.unmount();

    const { rerender } = render(ChartSync, {
      share: ["hover", "selection", "brush", "zoom"],
    });
    traffic().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    // One series each, named by its chart's y accessor: the follower selects its own.
    expect(screen.getByTestId("selected-b")).toHaveTextContent(/:1$/);

    // A drag across chart A's plot brushes both.
    const onbrushA = vi.fn();
    await rerender({ share: ["hover", "brush"], onbrushA });
    const hit = screen
      .getByTestId("brush-a")
      .querySelector(".bx--viz-brush__hit") as Element;
    const svg = traffic();
    svg.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 400,
        height: 288,
        right: 400,
        bottom: 288,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    hit.setPointerCapture = () => {};
    hit.releasePointerCapture = () => {};
    await fireEvent.pointerDown(hit, {
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    await fireEvent.pointerMove(hit, {
      pointerId: 1,
      clientX: 250,
      clientY: 100,
    });
    await fireEvent.pointerUp(hit, {
      pointerId: 1,
      clientX: 250,
      clientY: 100,
    });
    expect(onbrushA).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("brush-b").textContent).not.toBe("");
    expect(document.querySelector(".bx--viz-brush__area")).not.toBeNull();
  });
});
