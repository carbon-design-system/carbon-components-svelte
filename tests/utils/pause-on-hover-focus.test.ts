import { createHoverFocusPause } from "../../src/utils/pause-on-hover-focus.js";

function fakeDismiss() {
  return { pause: vi.fn(), resume: vi.fn() };
}

describe("createHoverFocusPause", () => {
  it("mouseenter/focusin pause only when pauseOnHover is true", () => {
    const dismiss = fakeDismiss();
    const { handleMouseenter, handleFocusIn } = createHoverFocusPause(
      dismiss,
      () => false,
    );

    handleMouseenter();
    handleFocusIn();
    expect(dismiss.pause).not.toHaveBeenCalled();
  });

  it("mouseleave/focusout resume when focus/pointer has left the root", () => {
    const dismiss = fakeDismiss();
    const { handleMouseleave, handleFocusOut } = createHoverFocusPause(
      dismiss,
      () => true,
    );

    const root = document.createElement("div");

    const focusoutEvent = new FocusEvent("focusout", {
      relatedTarget: document.body,
    });
    Object.defineProperty(focusoutEvent, "currentTarget", { value: root });
    handleFocusOut(focusoutEvent);
    expect(dismiss.resume).toHaveBeenCalledTimes(1);

    const mouseleaveEvent = new MouseEvent("mouseleave", {
      relatedTarget: document.body,
    });
    Object.defineProperty(mouseleaveEvent, "currentTarget", { value: root });
    handleMouseleave(mouseleaveEvent);
    expect(dismiss.resume).toHaveBeenCalledTimes(2);
  });

  it("does not resume when relatedTarget is still inside the root", () => {
    const dismiss = fakeDismiss();
    const { handleFocusOut } = createHoverFocusPause(dismiss, () => true);

    const root = document.createElement("div");
    const child = document.createElement("button");
    root.appendChild(child);

    const event = new FocusEvent("focusout", { relatedTarget: child });
    Object.defineProperty(event, "currentTarget", { value: root });

    handleFocusOut(event);
    expect(dismiss.resume).not.toHaveBeenCalled();
  });

  it("resumes on mouseleave after pauseOnHover is turned off while paused", () => {
    const dismiss = fakeDismiss();
    let pauseOnHover = true;
    const { handleMouseenter, handleMouseleave } = createHoverFocusPause(
      dismiss,
      () => pauseOnHover,
    );
    const root = document.createElement("div");

    handleMouseenter();
    pauseOnHover = false;
    const event = new MouseEvent("mouseleave", {
      relatedTarget: document.body,
    });
    Object.defineProperty(event, "currentTarget", { value: root });
    handleMouseleave(event);

    expect(dismiss.resume).toHaveBeenCalledTimes(1);
  });

  it("does not resume when focus leaves while the pointer is still over the root", () => {
    const dismiss = fakeDismiss();
    const { handleMouseenter, handleFocusIn, handleFocusOut } =
      createHoverFocusPause(dismiss, () => true);
    const root = document.createElement("div");

    handleMouseenter();
    handleFocusIn();
    const event = new FocusEvent("focusout", { relatedTarget: document.body });
    Object.defineProperty(event, "currentTarget", { value: root });
    handleFocusOut(event);

    expect(dismiss.resume).not.toHaveBeenCalled();
  });

  it("does not resume when the root still contains document.activeElement", () => {
    const dismiss = fakeDismiss();
    const { handleMouseleave } = createHoverFocusPause(dismiss, () => true);

    const root = document.createElement("div");
    const child = document.createElement("button");
    root.appendChild(child);
    document.body.appendChild(root);
    child.focus();

    const event = new MouseEvent("mouseleave");
    Object.defineProperty(event, "currentTarget", { value: root });

    handleMouseleave(event);
    expect(dismiss.resume).not.toHaveBeenCalled();

    root.remove();
  });

  it("holds the pause from getPaused through hover and focus changes", () => {
    const dismiss = fakeDismiss();
    let paused = true;
    const { handleMouseenter, handleMouseleave, refresh } =
      createHoverFocusPause(
        dismiss,
        () => false,
        () => paused,
      );
    const root = document.createElement("div");

    handleMouseenter();
    const event = new MouseEvent("mouseleave", {
      relatedTarget: document.body,
    });
    Object.defineProperty(event, "currentTarget", { value: root });
    handleMouseleave(event);
    expect(dismiss.pause).toHaveBeenCalledTimes(2);
    expect(dismiss.resume).not.toHaveBeenCalled();

    paused = false;
    refresh();
    expect(dismiss.resume).toHaveBeenCalledTimes(1);
  });
});
