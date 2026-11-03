// @vitest-environment node
import TimezonePicker from "carbon-components-svelte/TimezonePicker/TimezonePicker.svelte";
import { onServerIn } from "../IntlPicker/server";
import { renderSSR } from "../utils/ssr";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const props = { value: "America/Los_Angeles", locale: "fr", detect: true };

describe("TimezonePicker on the server", () => {
  const render = () =>
    renderSSR(TimezonePicker, { ...props, labelText: "Field" });

  it("writes the selected name from `locale`, with the menu closed", () => {
    const { document } = render();

    expect(document.querySelector("input")?.getAttribute("value")).toBe(
      "Los Angeles",
    );
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
  });

  it("does not follow the server's own locale or time zone", () => {
    const { html: here } = render();
    onServerIn("ja-JP", "Asia/Tokyo");
    const { html: there } = render();

    expect(there).toBe(here);
  });

  it("posts the code from a hidden input", () => {
    const { document } = renderSSR(TimezonePicker, {
      ...props,
      name: "field",
      labelText: "Field",
    });

    const hidden = document.querySelector('input[name="field"]');
    expect(hidden?.getAttribute("type")).toBe("hidden");
    expect(hidden?.getAttribute("value")).toBe("America/Los_Angeles");
  });

  it("leaves the field empty when detecting, so the browser's zone arrives after mount", () => {
    onServerIn("en-US", "Asia/Tokyo");
    const { document } = renderSSR(TimezonePicker, {
      labelText: "Zone",
      detect: true,
    });

    expect(document.querySelector("input")?.getAttribute("value") ?? "").toBe(
      "",
    );
  });

  it("reads no clock, so an open menu renders the same at any time", () => {
    const renderOpen = () =>
      renderSSR(TimezonePicker, {
        labelText: "Zone",
        values: ["America/Los_Angeles", "Asia/Tokyo"],
        open: true,
      });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    const winter = renderOpen();
    vi.setSystemTime(new Date("2026-07-15T12:00:00Z"));
    const summer = renderOpen();

    expect(summer.html).toBe(winter.html);
    expect(winter.document.querySelectorAll('[role="option"]')).toHaveLength(2);
    expect(winter.html).not.toContain("UTC-");
  });

  it("shows offsets on the server from an explicit `date`", () => {
    const { document } = renderSSR(TimezonePicker, {
      labelText: "Zone",
      values: ["America/Los_Angeles"],
      date: new Date("2026-07-15T12:00:00Z"),
      open: true,
    });

    expect(document.querySelector('[role="option"]')).toHaveTextContent(
      "UTC-07:00",
    );
  });
});
