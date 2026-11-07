import { fireEvent, screen } from "@testing-library/svelte";
import type { SignaturePadValue } from "carbon-components-svelte/SignaturePad/SignaturePad.svelte";
import { tick } from "svelte";

const PAD_NAME = /^Signature/;

/** The signing area, a 600 by 200 box in the document. */
export function getPad() {
  const pad = screen.getByRole("img", { name: PAD_NAME });
  pad.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 600,
      bottom: 200,
      width: 600,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return pad;
}

type Sample = [x: number, y: number];

/** Press, move through `samples`, and release with the given pointer. */
export async function drawStroke(
  pad: HTMLElement,
  samples: Sample[],
  init: PointerEventInit = {},
  end: "pointerup" | "pointercancel" = "pointerup",
) {
  const base = { pointerId: 1, button: 0, pointerType: "mouse", ...init };
  const [first, ...rest] = samples;
  await fireEvent(
    pad,
    new PointerEvent("pointerdown", {
      ...base,
      clientX: first[0],
      clientY: first[1],
    }),
  );
  for (const [clientX, clientY] of rest) {
    // eslint-disable-next-line no-await-in-loop -- each move is its own event
    await fireEvent(
      pad,
      new PointerEvent("pointermove", { ...base, clientX, clientY }),
    );
  }
  const [lastX, lastY] = samples[samples.length - 1];
  await fireEvent(
    pad,
    new PointerEvent(end, { ...base, clientX: lastX, clientY: lastY }),
  );
  await tick();
}

export const wave: Sample[] = [
  [40, 120],
  [80, 60],
  [120, 130],
  [160, 70],
  [200, 120],
];

/** The pad's value, which the test expects to be there. */
export function signed(pad: { value?: SignaturePadValue | null }) {
  const { value } = pad;
  assert(value);
  return value;
}
