import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import {
  createAsyncSource,
  createPagedSource,
} from "carbon-components-svelte/utils/async-source.js";
import { getInput } from "./helpers";

type Pending = {
  query: string;
  signal: AbortSignal;
  cursor?: unknown;
  resolve: (items: ComboBoxItem[]) => void;
  reject: (error: unknown) => void;
};

/** A source whose requests are answered by hand. */
function manual() {
  const pending: Pending[] = [];
  const source = createAsyncSource<ComboBoxItem[]>(
    (query, { signal }) =>
      new Promise((resolve, reject) => {
        pending.push({ query, signal, resolve, reject });
      }),
  );
  return { pending, source };
}

const names = (...text: string[]): ComboBoxItem[] =>
  text.map((value) => ({ id: value.toLowerCase(), text: value }));

// user-event stalls under fake timers, so these tests drive the input with
// fireEvent. An input event on the focused input sets `value` and opens the
// menu.
function type(value: string) {
  getInput().focus();
  return fireEvent.input(getInput(), { target: { value } });
}

const optionNames = () =>
  screen.queryAllByRole("option").map((option) => option.textContent?.trim());

describe("ComboBox source", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks the source for the typed text and shows its answer", async () => {
    const { pending, source } = manual();
    render(ComboBox, { props: { labelText: "User", source } });

    await type("al");
    expect(pending.map((call) => call.query)).toEqual(["al"]);

    pending[0].resolve(names("Alice", "Alan"));
    await vi.advanceTimersByTimeAsync(0);
    expect(optionNames()).toEqual(["Alice", "Alan"]);
  });

  it("shows items until the source has an answer", async () => {
    const { source } = manual();
    render(ComboBox, {
      props: { labelText: "User", source, items: names("Recent one") },
    });

    await type("");
    expect(optionNames()).toEqual(["Recent one"]);
  });

  it("marks the menu busy and keeps the last answer while the next loads", async () => {
    const { pending, source } = manual();
    render(ComboBox, { props: { labelText: "User", source } });

    await type("a");
    pending[0].resolve(names("Alice"));
    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-busy");

    await type("al");
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(optionNames()).toEqual(["Alice"]);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("shows only the newest answer when an older one arrives last", async () => {
    const { pending, source } = manual();
    render(ComboBox, { props: { labelText: "User", source } });

    await type("a");
    await type("al");
    pending[1].resolve(names("Alan"));
    await vi.advanceTimersByTimeAsync(0);
    pending[0].resolve(names("Anna"));
    await vi.advanceTimersByTimeAsync(0);

    expect(optionNames()).toEqual(["Alan"]);
    expect(pending[0].signal.aborted).toBe(true);
  });

  it("keeps the selected item selected when a later answer does not hold it", async () => {
    const { pending, source } = manual();
    render(ComboBox, { props: { labelText: "User", source } });
    const input = getInput();

    await type("al");
    pending[0].resolve(names("Alice", "Alan"));
    await vi.advanceTimersByTimeAsync(0);
    await fireEvent.click(screen.getByRole("option", { name: "Alice" }));
    expect(input).toHaveValue("Alice");

    await type("zz");
    pending[1].resolve(names("Zed"));
    await vi.advanceTimersByTimeAsync(0);
    expect(optionNames()).toEqual(["Zed"]);

    // Closing with the selection absent from the answer restores its text.
    input.blur();
    await fireEvent.keyDown(input, { key: "ArrowUp", altKey: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(input).toHaveValue("Alice");
  });

  it("shows the error row instead of an empty state, and recovers on the next input", async () => {
    const { pending, source } = manual();
    render(ComboBox, {
      props: { labelText: "User", source, errorText: "Search is down" },
    });

    await type("a");
    pending[0].reject(new Error("503"));
    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText("Search is down")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
    expect(optionNames()).toEqual([]);

    await type("al");
    expect(screen.queryByText("Search is down")).toBeNull();
    pending[1].resolve(names("Alice"));
    await vi.advanceTimersByTimeAsync(0);
    expect(optionNames()).toEqual(["Alice"]);
  });

  it("announces the result count once the answer settles", async () => {
    const { pending, source } = manual();
    render(ComboBox, { props: { labelText: "User", source } });

    await type("al");
    await vi.advanceTimersByTimeAsync(2000);
    expect(screen.getByRole("status")).toHaveTextContent("");

    pending[0].resolve(names("Alice", "Alan"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(screen.getByRole("status")).toHaveTextContent("2 results available");
  });

  it("asks nothing while the menu is closed", async () => {
    const { pending, source } = manual();
    render(ComboBox, { props: { labelText: "User", source } });

    getInput().focus();
    await fireEvent.input(getInput(), { target: { value: "" } });
    await fireEvent.keyDown(getInput(), { key: "Escape" });
    const before = pending.length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(pending).toHaveLength(before);
  });

  it("aborts the request when the combo box is removed", async () => {
    const { pending, source } = manual();
    const { unmount } = render(ComboBox, {
      props: { labelText: "User", source },
    });

    await type("al");
    expect(pending[0].signal.aborted).toBe(false);
    unmount();
    expect(pending[0].signal.aborted).toBe(true);
  });

  it("works with no source", async () => {
    render(ComboBox, {
      props: { labelText: "User", items: names("Alice", "Bob") },
    });
    await type("");
    expect(optionNames()).toEqual(["Alice", "Bob"]);
  });

  describe("paged source", () => {
    type Page = { items: ComboBoxItem[]; nextCursor?: string | null };

    function paged() {
      const pending: Pending[] = [];
      const source = createPagedSource<ComboBoxItem, string, string, Page>(
        (query, { signal, cursor }) =>
          new Promise<Page>((resolve, reject) => {
            pending.push({
              query,
              signal,
              cursor,
              resolve: resolve as never,
              reject,
            });
          }),
      );
      return { pending, source };
    }

    it("asks for the next page when the menu is scrolled to the bottom", async () => {
      const { pending, source } = paged();
      render(ComboBox, { props: { labelText: "User", source } });

      await type("a");
      (pending[0].resolve as unknown as (page: Page) => void)({
        items: names("Alice", "Amir"),
        nextCursor: "c1",
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(optionNames()).toEqual(["Alice", "Amir"]);

      const menu = screen.getByRole("listbox");
      Object.defineProperty(menu, "scrollHeight", { value: 200 });
      Object.defineProperty(menu, "clientHeight", { value: 100 });
      menu.scrollTop = 100;
      await fireEvent.scroll(menu);

      expect(pending).toHaveLength(2);
      expect(pending[1].cursor).toBe("c1");
      expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      (pending[1].resolve as unknown as (page: Page) => void)({
        items: names("Anna"),
        nextCursor: null,
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(optionNames()).toEqual(["Alice", "Amir", "Anna"]);
      expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-busy");
    });
  });
});
