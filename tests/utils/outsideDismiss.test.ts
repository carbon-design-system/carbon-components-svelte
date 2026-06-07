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

  test("resets the flag after release", () => {
    const onDismiss = vi.fn();
    const dismiss = createOutsideDismiss(onDismiss);

    dismiss.pressInside();
    dismiss.release();
    expect(onDismiss).not.toHaveBeenCalled();

    dismiss.release();
    expect(onDismiss).toHaveBeenCalledTimes(1);
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
});
