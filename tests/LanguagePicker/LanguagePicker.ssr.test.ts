// @vitest-environment node
import LanguagePicker from "carbon-components-svelte/LanguagePicker/LanguagePicker.svelte";
import { onServerIn } from "../IntlPicker/server";
import { renderSSR } from "../utils/ssr";

afterEach(() => {
  vi.restoreAllMocks();
});

const props = { value: "pt-BR", locale: "es", variants: true, detect: true };

describe("LanguagePicker on the server", () => {
  const render = () =>
    renderSSR(LanguagePicker, { ...props, labelText: "Field" });

  it("writes the selected name from `locale`, with the menu closed", () => {
    const { document } = render();

    expect(document.querySelector("input")?.getAttribute("value")).toBe(
      "portugués (Brasil)",
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
    const { document } = renderSSR(LanguagePicker, {
      ...props,
      name: "field",
      labelText: "Field",
    });

    const hidden = document.querySelector('input[name="field"]');
    expect(hidden?.getAttribute("type")).toBe("hidden");
    expect(hidden?.getAttribute("value")).toBe("pt-BR");
  });
});
