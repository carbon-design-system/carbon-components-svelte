import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ToolbarSearchExtraUpdates from "./ToolbarSearchExtraUpdates.test.svelte";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";
import ToolbarSearchUnsubscribe from "./ToolbarSearchUnsubscribe.test.svelte";

describe("ToolbarSearch label", () => {
  it("names the search field and landmark by default", () => {
    render(ToolbarSearchHost);

    expect(
      screen.getByRole("searchbox", { name: "Search" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("search", { name: "Search" })).toBeInTheDocument();
  });

  it("uses a custom labelText", () => {
    render(ToolbarSearchHost, {
      props: { searchProps: { labelText: "Filter servers" } },
    });

    expect(
      screen.getByRole("searchbox", { name: "Filter servers" }),
    ).toBeInTheDocument();
  });
});

describe("ToolbarSearch clear()", () => {
  it("resets value and collapses the search", async () => {
    render(ToolbarSearchHost);

    const input = screen.getByRole("searchbox");
    await user.type(input, "Alpha");

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("Alpha");
    });

    const container = input.closest(".bx--toolbar-search-container-expandable");
    expect(
      container?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);

    await user.click(screen.getByTestId("clear"));

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("");
    });
    expect(
      container?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(false);
  });

  it("keeps a persistent search expanded", async () => {
    render(ToolbarSearchHost, {
      props: { searchProps: { persistent: true }, expanded: true },
    });

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Bravo" } });
    expect(screen.getByTestId("value").textContent).toBe("Bravo");

    // Click without moving focus: blurring a persistent search collapses it
    // on its own, which would mask `clear()`.
    await fireEvent.click(screen.getByTestId("clear"));

    expect(screen.getByTestId("value").textContent).toBe("");
    const container = input.closest(".bx--toolbar-search-container-persistent");
    expect(container).not.toBeNull();
    expect(
      container?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);
  });
});

describe("ToolbarSearch focus", () => {
  it("expands an empty collapsed search on focus", async () => {
    const { container } = render(ToolbarSearchHost);

    const wrapper = container.querySelector(".bx--search");
    expect(wrapper).not.toHaveClass("bx--toolbar-search-container-active");

    await user.click(screen.getByRole("searchbox"));

    expect(wrapper).toHaveClass("bx--toolbar-search-container-active");
  });
});

describe("ToolbarSearch numeric value", () => {
  it("does not crash when value is a number and expands when non-zero", () => {
    const { container } = render(ToolbarSearchHost, {
      props: { value: 123 },
    });

    const wrapper = container.querySelector(".bx--search");
    expect(wrapper).not.toBeNull();
    expect(
      wrapper?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);
  });

  it("treats numeric 0 as a value and expands (no longer swallowed)", () => {
    const { container } = render(ToolbarSearchHost, {
      props: { value: 0 },
    });

    const wrapper = container.querySelector(".bx--search");
    expect(
      wrapper?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);
  });

  it("does not expand when value is the empty string", () => {
    const { container } = render(ToolbarSearchHost, {
      props: { value: "" },
    });

    const wrapper = container.querySelector(".bx--search");
    expect(
      wrapper?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(false);
  });
});

describe("ToolbarSearch search event", () => {
  it("forwards the search event dispatched on Enter", async () => {
    const onsearch = vi.fn();
    render(ToolbarSearchHost, {
      props: {
        rows: [
          { id: 1, name: "Balancer 1" },
          { id: 2, name: "Balancer 2" },
        ],
        searchProps: { persistent: true },
        onsearch,
      },
    });

    const input = screen.getByRole("searchbox");
    await user.type(input, "Balancer 1{Enter}");

    expect(onsearch).toHaveBeenCalledExactlyOnceWith("Balancer 1");
  });
});

describe("ToolbarSearch selectTextOnFocus passthrough", () => {
  it("forwards selectTextOnFocus to the underlying Search field", async () => {
    render(ToolbarSearchHost, {
      props: {
        value: "Alpha",
        searchProps: { persistent: true, selectTextOnFocus: true },
      },
    });

    const input = screen.getByRole("searchbox");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Alpha".length);
  });
});

describe("ToolbarSearch outside a DataTable", () => {
  it("renders with shouldFilterRows without throwing", () => {
    expect(() =>
      render(ToolbarSearch, { shouldFilterRows: true }),
    ).not.toThrow();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});

describe("ToolbarSearch does not refilter on unrelated updates", () => {
  it("only calls filterRows when value/rows/shouldFilterRows change", async () => {
    const onFilterRows = vi.fn();
    render(ToolbarSearchExtraUpdates, { props: { onFilterRows } });

    // Snapshot the call count after mount; we don't assert an exact mount
    // count since the initial filter may legitimately run during setup.
    expect(onFilterRows).toHaveBeenCalled();
    onFilterRows.mockClear();

    // Click a button that only bumps an unrelated reactive value (which
    // changes ToolbarSearch's `tabindex` prop). This should NOT trigger a
    // refilter; the search value, rows, and shouldFilterRows are unchanged.
    await user.click(screen.getByRole("button", { name: "Bump unrelated" }));
    expect(onFilterRows).not.toHaveBeenCalled();
  });
});

// Regression test: toggling `shouldFilterRows` used to overwrite the
// component's `unsubscribe` handle without calling the previous one first,
// leaking a live `tableRows` subscriber on every `false -> true` toggle.
// Each leaked subscriber re-runs the row-equality check on every emission,
// so the leak compounds with every toggle over a component's lifetime.
describe("ToolbarSearch unsubscribes from tableRows before resubscribing", () => {
  it("keeps exactly one live subscriber after toggling shouldFilterRows repeatedly", async () => {
    // "Change rows" produces a genuinely different `rows` value, which the
    // active `ToolbarSearch` independently replays through `filterRows`, so
    // even a single live subscriber sees more than one emission from it.
    // Comparing a toggled instance against a freshly mounted control (never
    // toggled, so it can only ever have exactly one live subscriber) isolates
    // the thing this test actually guards -- extra emissions from LEAKED
    // subscribers -- from that unrelated, expected replay fan-out.
    const onControlTableRows = vi.fn();
    const control = render(ToolbarSearchUnsubscribe, {
      props: { onTableRows: onControlTableRows },
    });
    onControlTableRows.mockClear();
    await user.click(
      within(control.container).getByRole("button", { name: "Change rows" }),
    );
    const controlDelta = onControlTableRows.mock.calls.length;

    const onTableRows = vi.fn();
    const { container } = render(ToolbarSearchUnsubscribe, {
      props: { onTableRows },
    });
    const toggleButton = within(container).getByRole("button", {
      name: "Toggle filter",
    });

    // Mounts with `shouldFilterRows = true` (one live subscription), then
    // toggles true -> false -> true -> false -> true.
    for (let i = 0; i < 4; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential execution is intentional
      await user.click(toggleButton);
    }

    onTableRows.mockClear();

    await user.click(
      within(container).getByRole("button", { name: "Change rows" }),
    );

    // Before the fix, each `false -> true` toggle leaked the previous
    // subscription, so a toggled instance would see more emissions than the
    // control instead of matching it exactly.
    expect(onTableRows).toHaveBeenCalledTimes(controlDelta);
  });
});
