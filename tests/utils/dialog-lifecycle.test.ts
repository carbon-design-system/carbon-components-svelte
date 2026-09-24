// @vitest-environment node
import { createDialogLifecycle } from "../../src/utils/dialog-lifecycle.js";

function createHarness(
  overrides: Partial<Parameters<typeof createDialogLifecycle>[0]> = {},
) {
  const dispatch = vi.fn(() => true);
  const setOpen = vi.fn();
  const focus = vi.fn();
  const saveFocusReturn = vi.fn();
  let liveOpen = false;

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen,
    preventCloseOnClickOutside: () => false,
    saveFocusReturn,
    focus,
    getOpen: () => liveOpen,
    ...overrides,
  });

  return {
    lifecycle,
    dispatch,
    setOpen,
    focus,
    saveFocusReturn,
    setLiveOpen: (value: boolean) => {
      liveOpen = value;
    },
  };
}

describe("createDialogLifecycle", () => {
  describe("close()", () => {
    it("dispatches a cancelable close and sets open false when not prevented", () => {
      const { lifecycle, dispatch, setOpen } = createHarness();

      lifecycle.close("escape-key");

      expect(dispatch).toHaveBeenCalledWith(
        "close",
        { trigger: "escape-key" },
        { cancelable: true },
      );
      expect(setOpen).toHaveBeenCalledWith(false);
    });

    it("does not set open when a listener prevents it", () => {
      const dispatch = vi.fn(() => false);
      const { lifecycle, setOpen } = createHarness({ dispatch });

      lifecycle.close("outside-click");

      expect(setOpen).not.toHaveBeenCalled();
    });
  });

  describe("outsideDismiss", () => {
    it('closes with "outside-click" on an outside press/release', () => {
      const { lifecycle, dispatch } = createHarness();

      lifecycle.outsideDismiss.pressOutside();
      lifecycle.outsideDismiss.release();

      expect(dispatch).toHaveBeenCalledWith(
        "close",
        { trigger: "outside-click" },
        { cancelable: true },
      );
    });

    it("does not close when preventCloseOnClickOutside is true", () => {
      const { lifecycle, dispatch } = createHarness({
        preventCloseOnClickOutside: () => true,
      });

      lifecycle.outsideDismiss.pressOutside();
      lifecycle.outsideDismiss.release();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it("does not close on a press that began inside", () => {
      const { lifecycle, dispatch } = createHarness();

      lifecycle.outsideDismiss.pressInside();
      lifecycle.outsideDismiss.release();

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("syncOpen()", () => {
    it("does nothing on the initial false->false call", () => {
      const { lifecycle, dispatch, saveFocusReturn } = createHarness();

      lifecycle.syncOpen(false);

      expect(dispatch).not.toHaveBeenCalled();
      expect(saveFocusReturn).not.toHaveBeenCalled();
    });

    it('an opening transition saves focus and dispatches "open"', () => {
      const { lifecycle, dispatch, saveFocusReturn } = createHarness();

      lifecycle.syncOpen(true);

      expect(saveFocusReturn).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith("open");
    });

    it('a closing transition after mount dispatches "close" with trigger programmatic', async () => {
      const { lifecycle, dispatch, setLiveOpen } = createHarness();

      setLiveOpen(true);
      lifecycle.syncOpen(true);
      dispatch.mockClear();

      setLiveOpen(false);
      lifecycle.syncOpen(false);
      await Promise.resolve().then().then().then();

      expect(dispatch).toHaveBeenCalledWith("close", {
        trigger: "programmatic",
      });
    });

    it("a closing transition already dispatched by close() does not double-dispatch", async () => {
      const { lifecycle, dispatch, setLiveOpen } = createHarness();

      setLiveOpen(true);
      lifecycle.syncOpen(true);
      dispatch.mockClear();

      lifecycle.close("escape-key");
      setLiveOpen(false);
      dispatch.mockClear();
      lifecycle.syncOpen(false);
      await Promise.resolve().then().then().then();

      expect(dispatch).not.toHaveBeenCalledWith("close", {
        trigger: "programmatic",
      });
    });

    it("setMounted() must be called before a later open transition re-focuses", async () => {
      const { lifecycle, focus, setLiveOpen } = createHarness();

      setLiveOpen(true);
      lifecycle.syncOpen(true);
      await Promise.resolve().then().then().then();
      expect(focus).not.toHaveBeenCalled();

      lifecycle.setMounted();
      setLiveOpen(false);
      lifecycle.syncOpen(false);
      setLiveOpen(true);
      lifecycle.syncOpen(true);
      await Promise.resolve().then().then().then();
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it("the deferred re-focus re-reads the live open value, not a snapshot", async () => {
      const { lifecycle, focus, setLiveOpen } = createHarness();

      lifecycle.setMounted();
      setLiveOpen(true);
      lifecycle.syncOpen(true);
      // The dialog closes again before the tick() resolves.
      setLiveOpen(false);
      await Promise.resolve().then().then().then();

      expect(focus).not.toHaveBeenCalled();
    });
  });
});
