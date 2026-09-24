import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DatePickerInDialog from "./DatePickerInDialog.test.svelte";

describe("DatePicker inside a top-layer dialog", () => {
  it("registers a passive capture scroll listener and repositions once per frame", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const frames: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => frames.push(callback));

    render(DatePickerInDialog);
    await user.click(screen.getByLabelText("Date"));
    await screen.findByLabelText("calendar-container");

    const scrollCall = add.mock.calls.find(([type]) => type === "scroll");
    expect(scrollCall?.[2]).toEqual({ capture: true, passive: true });
    // Pooled `window` listeners (see `window-listener-pool.js`) register one
    // real listener per `(type, options)` pair, shared across consumers, so
    // the scroll and resize registrations no longer share a function
    // reference the way an unpooled `addEventListener` pair would.
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

    add.mockRestore();
    raf.mockRestore();
  });
});
