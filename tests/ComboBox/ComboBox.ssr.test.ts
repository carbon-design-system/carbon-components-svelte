// @vitest-environment node
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { createAsyncSource } from "carbon-components-svelte/utils/async-source.js";
import { renderSSR } from "../utils/ssr";

const items = [
  { id: "us", text: "US East" },
  { id: "eu", text: "EU West" },
];

it("renders the selected item's text in the input", () => {
  const { document } = renderSSR(ComboBox, {
    labelText: "Region",
    selectedId: "eu",
    items,
  });

  expect(document.querySelector("input")?.getAttribute("value")).toBe(
    "EU West",
  );
});

describe("with a source", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders its initial answer and starts no request or timer", () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(() => Promise.resolve(items));
    const source = createAsyncSource(fetcher, {
      debounce: 200,
      initialData: items,
      initialQuery: "",
    });

    const { document } = renderSSR(ComboBox, {
      labelText: "Region",
      source,
      open: true,
    });

    expect(
      [...document.querySelectorAll('[role="option"]')].map((option) =>
        option.textContent?.trim(),
      ),
    ).toEqual(["US East", "EU West"]);
    expect(fetcher).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
