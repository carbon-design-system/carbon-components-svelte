import { render } from "@testing-library/svelte";
import DatePickerHost from "./DatePickerHost.test.svelte";
import { openCalendar } from "./helpers";

describe("DatePicker inside a top-layer dialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a passive capture scroll listener and repositions once per frame", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
      frames.push(callback),
    );

    render(DatePickerHost);
    await openCalendar();

    const scrollCall = add.mock.calls.find(([type]) => type === "scroll");
    expect(scrollCall?.[2]).toEqual({ capture: true, passive: true });
    // Pooled listeners are shared per `(type, options)`, so scroll and
    // resize no longer share one function reference.
    const resizeCall = add.mock.calls.find(
      ([type, , options]) =>
        type === "resize" &&
        typeof options === "object" &&
        options?.passive === true &&
        !("capture" in options),
    );
    expect(resizeCall?.[2]).toEqual({ passive: true });

    // Several scroll events in one frame schedule a single reposition.
    frames.length = 0;
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(1);
  });
});
