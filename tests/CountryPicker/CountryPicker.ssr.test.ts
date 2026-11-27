// @vitest-environment node
import CountryPicker from "carbon-components-svelte/CountryPicker/CountryPicker.svelte";
import { onServerIn } from "../IntlPicker/server";
import { renderSSR } from "../utils/ssr";

afterEach(() => {
  vi.restoreAllMocks();
});

const props = { value: "CH", locale: "de", detect: true };

describe("CountryPicker on the server", () => {
  const render = () =>
    renderSSR(CountryPicker, { ...props, labelText: "Field" });

  it("writes the selected name from `locale`, with the menu closed", () => {
    const { document } = render();

    expect(document.querySelector("input")?.getAttribute("value")).toBe(
      "Schweiz",
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
    const { document } = renderSSR(CountryPicker, {
      ...props,
      name: "field",
      labelText: "Field",
    });

    const hidden = document.querySelector('input[name="field"]');
    expect(hidden?.getAttribute("type")).toBe("hidden");
    expect(hidden?.getAttribute("value")).toBe("CH");
  });

  it("leaves the field empty when detecting, so the region arrives after mount", () => {
    const { document } = renderSSR(CountryPicker, {
      labelText: "Country",
      locale: "de",
      detect: true,
    });

    expect(document.querySelector("input")?.getAttribute("value") ?? "").toBe(
      "",
    );
  });
});
