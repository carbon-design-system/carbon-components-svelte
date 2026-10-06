// @vitest-environment node
import Meter from "carbon-components-svelte/Meter/Meter.svelte";
import { render } from "svelte/server";
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

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(Meter, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("Meter server render ids", () => {
  const props = {
    id: "disk",
    value: 60,
    labelText: "Disk",
    helperText: "Used space",
    thresholds: { warning: 50, error: 90 },
    showThresholds: true,
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the helper and thresholds ids from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('id="disk-helper"');
    expect(html).toContain('id="disk-thresholds"');
    expect(html).toContain('aria-describedby="disk-helper disk-thresholds"');
  });

  it("derives the status id from the id and references it", () => {
    const html = renderRaw({
      ...props,
      valueText: "60 GB of 100 GB",
      status: "warning",
    });

    expect(html).toContain('id="disk-status"');
    expect(html).toMatch(/id="disk-status"[^>]*>Warning</);
    expect(html).toContain(
      'aria-describedby="disk-status disk-helper disk-thresholds"',
    );
  });
});
