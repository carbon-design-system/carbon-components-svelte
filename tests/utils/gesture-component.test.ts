import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import GestureHost from "./GestureHost.test.svelte";

function pointer(type: string, init: PointerEventInit = {}) {
  return new PointerEvent(type, {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

describe("use:gesture in a component", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("taps, and a held finger then drags, with state updating in the markup", async () => {
    render(GestureHost);
    const surface = screen.getByTestId("surface");

    surface.dispatchEvent(pointer("pointerdown", { clientX: 5 }));
    document.dispatchEvent(pointer("pointerup", { clientX: 5 }));
    await tick();
    expect(screen.getByTestId("taps")).toHaveTextContent("1");

    surface.dispatchEvent(pointer("pointerdown", { clientX: 5 }));
    vi.advanceTimersByTime(600);
    await tick();
    expect(screen.getByTestId("held")).toHaveTextContent("true");
    document.dispatchEvent(pointer("pointermove", { clientX: 5, clientY: 3 }));
    document.dispatchEvent(pointer("pointermove", { clientX: 45, clientY: 3 }));
    await tick();
    expect(screen.getByTestId("dx")).toHaveTextContent("40");
    document.dispatchEvent(pointer("pointerup", { clientX: 45, clientY: 3 }));
    await tick();
    expect(screen.getByTestId("held")).toHaveTextContent("false");
  });

  it("stops listening when the prop turns it off, and when unmounted", async () => {
    const { rerender, unmount } = render(GestureHost);
    const surface = screen.getByTestId("surface");
    await rerender({ enabled: false });
    surface.dispatchEvent(pointer("pointerdown"));
    document.dispatchEvent(pointer("pointerup"));
    await tick();
    expect(screen.getByTestId("taps")).toHaveTextContent("0");

    await rerender({ enabled: true });
    expect(surface.style.touchAction).toBe("pan-y pinch-zoom");
    unmount();
    expect(surface.style.touchAction).toBe("");
  });

  it("leaves the page's click alone for a plain tap", async () => {
    render(GestureHost);
    const surface = screen.getByTestId("surface");
    const onClick = vi.fn();
    surface.addEventListener("click", onClick);
    surface.dispatchEvent(pointer("pointerdown", { pointerType: "mouse" }));
    document.dispatchEvent(pointer("pointerup", { pointerType: "mouse" }));
    await fireEvent.click(surface);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
