// @vitest-environment node
import Meter from "carbon-components-svelte/Meter/Meter.svelte";
import { renderSSR } from "../utils/ssr";

/** Normalize the narrow and no-break spaces some ICU versions print. */
const normalize = (text: string | null | undefined) =>
  (text ?? "").replace(/[  ]/g, " ");

describe("Meter server render", () => {
  it("formats the over capacity aria-valuetext with `locale`", () => {
    const { document } = renderSSR(Meter, {
      labelText: "Storage",
      value: 12345,
      max: 10000,
      locale: "de-DE",
    });

    const meter = document.querySelector('[role="meter"]');
    expect(normalize(meter?.getAttribute("aria-valuetext"))).toBe(
      "12.345 of 10.000, Error",
    );
  });

  it("formats the threshold description with `locale`", () => {
    const { document } = renderSSR(Meter, {
      labelText: "Storage",
      value: 100,
      max: 20000,
      thresholds: { warning: 12345, error: 15000 },
      showThresholds: true,
      locale: "de-DE",
    });

    expect(normalize(document.body.textContent)).toContain(
      "Warning at 12.345, error at 15.000",
    );
  });
});
