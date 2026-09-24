import {
  applyPostClearOptions,
  createMenuCloseHandler,
  createStatusAnnouncer,
} from "../../src/ListBox/menu-status.js";

describe("createStatusAnnouncer", () => {
  it("resets the text before setting it, so it always mutates", async () => {
    const setStatusText = vi.fn();
    const announceStatus = createStatusAnnouncer(setStatusText);

    const promise = announceStatus("foo");
    expect(setStatusText).toHaveBeenCalledWith("");
    expect(setStatusText).toHaveBeenCalledTimes(1);

    await promise;
    expect(setStatusText).toHaveBeenNthCalledWith(2, "foo");
    expect(setStatusText).toHaveBeenCalledTimes(2);
  });
});

describe("createMenuCloseHandler", () => {
  it("dispatches close and flips open when currently open", () => {
    let open = true;
    const dispatch = vi.fn();
    const close = createMenuCloseHandler({
      getOpen: () => open,
      setOpen: (next) => {
        open = next;
      },
      dispatch,
    });

    close("escape-key");

    expect(open).toBe(false);
    expect(dispatch).toHaveBeenCalledWith("close", { trigger: "escape-key" });
  });

  it("is a no-op when already closed", () => {
    const open = false;
    const dispatch = vi.fn();
    const setOpen = vi.fn();
    const close = createMenuCloseHandler({
      getOpen: () => open,
      setOpen,
      dispatch,
    });

    close("outside-click");

    expect(setOpen).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("applyPostClearOptions", () => {
  function buildTarget() {
    const target = document.createElement("input");
    const focus = vi.spyOn(target, "focus");
    return { target, focus };
  }

  it("focuses and does not reopen by default", async () => {
    const setOpen = vi.fn();
    const { target, focus } = buildTarget();

    await applyPostClearOptions(undefined, setOpen, () => target);

    expect(setOpen).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalledOnce();
  });

  it("reopens when options.open is true", async () => {
    const setOpen = vi.fn();
    const { target } = buildTarget();

    await applyPostClearOptions({ open: true }, setOpen, () => target);

    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("skips focusing when options.focus is false", async () => {
    const setOpen = vi.fn();
    const { target, focus } = buildTarget();

    await applyPostClearOptions({ focus: false }, setOpen, () => target);

    expect(focus).not.toHaveBeenCalled();
  });

  it("tolerates a missing focus target", async () => {
    const setOpen = vi.fn();

    await expect(
      applyPostClearOptions(undefined, setOpen, () => null),
    ).resolves.toBeUndefined();
  });
});
