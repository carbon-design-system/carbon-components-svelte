import { createOutsideDismiss } from "../../src/utils/outsideDismiss.js";

describe("createOutsideDismiss", () => {
  test("does not dismiss when the press began inside", () => {
    const onDismiss = vi.fn();
    const dismiss = createOutsideDismiss(onDismiss);

    dismiss.pressInside();
    dismiss.release();

    expect(onDismiss).not.toHaveBeenCalled();
  });

  test("dismisses when there was no inside press", () => {
    const onDismiss = vi.fn();
    const dismiss = createOutsideDismiss(onDismiss);

    dismiss.release();

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("does not dismiss on an orphaned release with no matching mousedown", () => {
    // A native <select> fires an unpaired `mouseup` on its host element when its
    // (browser-native) options popup closes, with no preceding `mousedown`. That
    // orphaned release must not read as an outside click.
    const onDismiss = vi.fn();
    const dismiss = createOutsideDismiss(onDismiss);

    dismiss.pressInside();
    dismiss.release();
    dismiss.release();

    expect(onDismiss).not.toHaveBeenCalled();
  });

  test("suppresses dismissal for each independent inside interaction", () => {
    const onDismiss = vi.fn();
    const dismiss = createOutsideDismiss(onDismiss);

    dismiss.pressInside();
    dismiss.release();
    dismiss.pressInside();
    dismiss.release();

    expect(onDismiss).not.toHaveBeenCalled();
  });

  test("pressOutside clears a prior inside press so the next release dismisses", () => {
    const onDismiss = vi.fn();
    const dismiss = createOutsideDismiss(onDismiss);

    dismiss.pressInside();
    dismiss.release();
    expect(onDismiss).not.toHaveBeenCalled();

    dismiss.pressOutside();
    dismiss.release();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
