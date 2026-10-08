import {
  applyPostClearOptions,
  createMenuCloseHandler,
  createMenuOpenHandler,
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

describe("createMenuOpenHandler", () => {
  function setup(initialOpen = false) {
    const state = { open: initialOpen };
    const dispatch = vi.fn();
    const handler = createMenuOpenHandler({
      getOpen: () => state.open,
      setOpen: (next) => {
        state.open = next;
      },
      dispatch,
    });
    return { state, dispatch, ...handler };
  }

  it("dispatches the recorded trigger once the open renders", () => {
    const { state, dispatch, openMenu, sync } = setup();

    openMenu("click");
    expect(state.open).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();

    sync();
    sync();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith("open", { trigger: "click" });
  });

  it('reports an unrecorded open as "programmatic"', () => {
    const { state, dispatch, sync } = setup();

    state.open = true;
    sync();

    expect(dispatch).toHaveBeenCalledWith("open", { trigger: "programmatic" });
  });

  it("skips an initially open menu and an open undone before rendering", () => {
    const { state, dispatch, openMenu, sync } = setup(true);

    sync();
    state.open = false;
    sync();
    openMenu("keydown");
    state.open = false;
    sync();

    expect(dispatch).not.toHaveBeenCalled();
  });
});
