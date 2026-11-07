import type { Page } from "@playwright/test";

export type SignatureValue = {
  type: "drawn" | "typed" | "uploaded";
  svg?: string;
  png?: string;
  text?: string;
};

type SignatureWindow = Window & {
  __signature?: SignatureValue | null;
  __pad?: {
    clear(): void;
    toPNG(options?: { scale?: number }): Promise<Blob | null>;
  };
  __counts?: { events: number; samples: number };
};

/** The value the SignaturePad fixtures publish on `window`. */
export function getSignature(page: Page) {
  return page.evaluate(
    () => (window as unknown as SignatureWindow).__signature ?? null,
  );
}

export function clearSignature(page: Page) {
  return page.evaluate(() =>
    (window as unknown as SignatureWindow).__pad?.clear(),
  );
}

/** Export the pad's PNG at `scale` pixels per unit and return its size. */
export function exportedSize(page: Page, scale: number) {
  return page.evaluate(async (pixelsPerUnit) => {
    const blob = await (window as unknown as SignatureWindow).__pad?.toPNG({
      scale: pixelsPerUnit,
    });
    if (!blob) throw new Error("nothing to export");
    const bitmap = await createImageBitmap(blob);
    return [bitmap.width, bitmap.height];
  }, scale);
}

/** Count `pointermove` events and the samples coalesced into them. */
export function countPointerMoves(page: Page) {
  return page.evaluate(() => {
    const counts = { events: 0, samples: 0 };
    (window as unknown as SignatureWindow).__counts = counts;
    document
      .querySelector('[role="img"]')
      ?.addEventListener("pointermove", (event) => {
        counts.events++;
        counts.samples += (event as PointerEvent).getCoalescedEvents().length;
      });
  });
}

export function readPointerMoves(page: Page) {
  return page.evaluate(
    () => (window as unknown as SignatureWindow).__counts ?? null,
  );
}
