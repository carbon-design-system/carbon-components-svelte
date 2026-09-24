// @vitest-environment node
import { createOpenCloseDispatcher } from "../../src/utils/dispatch-open-close.js";

describe("createOpenCloseDispatcher", () => {
  it("does not dispatch on the first call", () => {
    const dispatch = vi.fn();
    const notify = createOpenCloseDispatcher(dispatch);

    notify(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not dispatch on the first call even when initially open", () => {
    const dispatch = vi.fn();
    const notify = createOpenCloseDispatcher(dispatch);

    notify(true);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches "open" when a later call turns open true', () => {
    const dispatch = vi.fn();
    const notify = createOpenCloseDispatcher(dispatch);

    notify(false);
    notify(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith("open");
  });

  it('dispatches "close" when a later call turns open false', () => {
    const dispatch = vi.fn();
    const notify = createOpenCloseDispatcher(dispatch);

    notify(true);
    notify(false);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith("close");
  });

  it("dispatches on every subsequent change, alternating open/close", () => {
    const dispatch = vi.fn();
    const notify = createOpenCloseDispatcher(dispatch);

    notify(false);
    notify(true);
    notify(false);
    notify(true);
    expect(dispatch.mock.calls).toEqual([["open"], ["close"], ["open"]]);
  });

  it("dispatches on every call after the first, even repeating the same value", () => {
    const dispatch = vi.fn();
    const notify = createOpenCloseDispatcher(dispatch);

    notify(false);
    notify(false);
    notify(false);
    expect(dispatch.mock.calls).toEqual([["close"], ["close"]]);
  });
});
