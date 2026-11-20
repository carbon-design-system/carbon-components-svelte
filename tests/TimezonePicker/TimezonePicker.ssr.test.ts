// @vitest-environment node
import TimezonePicker from "carbon-components-svelte/TimezonePicker/TimezonePicker.svelte";
import { onServerIn } from "../IntlPicker/server";
import { renderSSR } from "../utils/ssr";

afterEach(() => {
  vi.restoreAllMocks();
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
});
