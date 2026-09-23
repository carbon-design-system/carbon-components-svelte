import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBoxReal from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { tick } from "svelte";
import ComboBox from "./ComboBox.test.svelte";

describe("ComboBox filter result announcements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Keep in sync with the `announceFilterResults` debounce delay in
  // ComboBox.svelte.
  const DEBOUNCE_MS = 800;

  const items: ComboBoxItem[] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];

  const substring = (item: ComboBoxItem, value: string) =>
    item.text.toLowerCase().includes(value.toLowerCase());

  const getInput = () => screen.getByRole("combobox");
  const getStatus = () => screen.getByRole("status");

  // user-event stalls under fake timers, so these tests drive the input with
  // fireEvent. An input event both sets `value` and opens the menu.
  const type = (value: string) =>
    fireEvent.input(getInput(), { target: { value } });

  // Escape also clears the selection, so close with Alt+ArrowUp instead.
  const closeMenu = () =>
    fireEvent.keyDown(getInput(), { key: "ArrowUp", altKey: true });

  it("announces the match count once typing pauses", async () => {
    render(ComboBox);

    await type("sl");
    expect(getStatus()).toHaveTextContent("");

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(getStatus()).toHaveTextContent("1 result available");
  });

  it("announces only the final count of a typing burst", async () => {
    render(ComboBox);

    await type("a");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 100);
    expect(getStatus()).toHaveTextContent("");

    await type("az");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(getStatus()).toHaveTextContent("No results");
  });

  it("pluralizes counts", async () => {
    render(ComboBox);

    await type("a");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(getStatus()).toHaveTextContent("3 results available");
  });

  it("skips the announcement when the count has not changed, supports a custom message", async () => {
    const filterResultsText = vi.fn((count: number) => `${count} matches`);
    render(ComboBoxReal, {
      props: { items, shouldFilterItem: substring, filterResultsText },
    });

    await type("sl");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(getStatus()).toHaveTextContent("1 matches");
    expect(filterResultsText).toHaveBeenCalledTimes(1);

    await type("sla");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(filterResultsText).toHaveBeenCalledTimes(1);
  });

  it("clears the region when the menu closes and announces again on reopen", async () => {
    render(ComboBox);

    await type("sl");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(getStatus()).toHaveTextContent("1 result available");

    await closeMenu();
    await tick();
    expect(getStatus()).toHaveTextContent("");

    await type("sl");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(getStatus()).toHaveTextContent("1 result available");
  });

  it("drops a pending announcement when the menu closes mid-debounce", async () => {
    render(ComboBox);

    await type("sl");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
    await closeMenu();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);

    expect(getStatus()).toHaveTextContent("");
  });

  it("stays silent when no filter is active", async () => {
    render(ComboBoxReal, { props: { items } });

    await type("sl");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(getStatus()).toHaveTextContent("");
  });

  it("counts the default typeahead filter", async () => {
    render(ComboBoxReal, { props: { items, typeahead: true } });

    await type("e");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(getStatus()).toHaveTextContent("1 result available");
  });
});
