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
    // Other components register their own resize listeners; match the one
    // sharing the calendar's reposition handler.
    const resizeCall = add.mock.calls.find(
      ([type, listener]) => type === "resize" && listener === scrollCall?.[1],
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
