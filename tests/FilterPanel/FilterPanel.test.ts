import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FilterPanel from "./FilterPanel.test.svelte";

const value = () => JSON.parse(screen.getByTestId("value").textContent ?? "");
const draft = () => JSON.parse(screen.getByTestId("draft").textContent ?? "");

describe("FilterPanel", () => {
  it("applies a checked option at once, and counts the others without it", async () => {
    const onchange = vi.fn();
    render(FilterPanel, { props: { onchange } });

    // 7 records: Acme has 2, Bolt 1.
    expect(
      screen.getByRole("checkbox", { name: "Acme 2" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Acme 2" }));
    expect(value()).toEqual({ brand: ["Acme"] });
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0].detail).toEqual({ brand: ["Acme"] });

    // Brand's own selection does not shrink brand's counts; color's do.
    expect(
      screen.getByRole("checkbox", { name: "Bolt 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "red 1" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "blue 1" })).toBeInTheDocument();
  });

  it("shows the number of selections on a facet's header", () => {
    render(FilterPanel, { props: { value: { brand: ["Acme", "Bolt"] } } });

    const header = screen.getByRole("button", { name: /^Brand/ });
    expect(within(header).getByText("2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear all" }),
    ).not.toHaveAttribute("aria-disabled");
  });

  it("waits for Apply in batch mode, and Reset puts the draft back", async () => {
    const onapply = vi.fn();
    render(FilterPanel, { props: { mode: "batch", onapply } });

    await user.click(screen.getByRole("checkbox", { name: "Acme 2" }));
    expect(draft()).toEqual({ brand: ["Acme"] });
    expect(value()).toEqual({});

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(draft()).toEqual({});

    await user.click(screen.getByRole("checkbox", { name: "Acme 2" }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(value()).toEqual({ brand: ["Acme"] });
    expect(onapply).toHaveBeenCalledTimes(1);
  });

  it("replaces the draft when the value changes from outside", async () => {
    const { rerender } = render(FilterPanel, {
      props: { mode: "batch", value: { brand: ["Acme"] } },
    });
    expect(screen.getByRole("checkbox", { name: "Acme 2" })).toBeChecked();

    await rerender({ mode: "batch", value: { brand: ["Bolt"] } });
    expect(draft()).toEqual({ brand: ["Bolt"] });
    expect(screen.getByRole("checkbox", { name: "Bolt 1" })).toBeChecked();
  });

  it("disables an option with no results, or hides it, but never a checked one", async () => {
    const { unmount } = render(FilterPanel, {
      props: { value: { color: "red" } },
    });
    // Nothing is blue and from Ghost with red chosen... Ghost has no records.
    await user.click(screen.getByRole("button", { name: "Show 4 more" }));
    expect(screen.getByRole("checkbox", { name: "Ghost 0" })).toBeDisabled();
    unmount();

    render(FilterPanel, {
      props: { zeroCounts: "hide", value: { brand: ["Ghost"] } },
    });
    // Ghost has no results but is checked, so it stays; the rest of the
    // zero-result options would go.
    expect(screen.getByRole("checkbox", { name: "Ghost 0" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Ghost 0" })).toBeEnabled();
  });

  it("collapses a long list behind Show more, and a search narrows it", async () => {
    render(FilterPanel);
    expect(screen.queryByRole("checkbox", { name: /Fuse/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show 4 more" }));
    expect(screen.getByRole("checkbox", { name: /Fuse/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.type(
      screen.getByRole("searchbox", { name: "Search Brand" }),
      "fu",
    );
    expect(
      screen.getAllByRole("checkbox", { name: /^(Acme|Fuse)/ }),
    ).toHaveLength(1);
    await user.clear(screen.getByRole("searchbox", { name: "Search Brand" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search Brand" }),
      "zzz",
    );
    expect(screen.getByText("No matching options")).toBeInTheDocument();
  });

  it("keeps a checked option in view in a collapsed list", () => {
    render(FilterPanel, { props: { value: { brand: ["Fuse"] } } });
    expect(screen.getByRole("checkbox", { name: /Fuse/ })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: /Dart/ })).toBeNull();
  });

  it("clears everything, and keeps focus on Clear all", async () => {
    const onclear = vi.fn();
    render(FilterPanel, {
      props: { value: { brand: ["Acme"], color: "red" }, onclear },
    });
    const clear = screen.getByRole("button", { name: "Clear all" });

    await user.click(clear);
    expect(value()).toEqual({});
    expect(onclear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveAttribute("aria-disabled", "true");
    expect(clear).toHaveFocus();

    await user.click(clear);
    expect(onclear).toHaveBeenCalledTimes(1);
  });

  it("clears a radio facet with Any", async () => {
    render(FilterPanel, { props: { value: { color: "red" } } });
    await user.click(screen.getByRole("radio", { name: "Any" }));
    expect(value()).toEqual({});
  });

  describe("result announcements", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("says the count once it stops changing, not at mount", async () => {
      render(FilterPanel);
      const status = screen.getAllByRole("status")[0];
      await vi.advanceTimersByTimeAsync(2000);
      expect(status).toHaveTextContent("");

      const acme = screen.getByRole("checkbox", { name: "Acme 2" });
      const bolt = screen.getByRole("checkbox", { name: "Bolt 1" });
      acme.click();
      await tick();
      await vi.advanceTimersByTimeAsync(300);
      bolt.click();
      await tick();
      await vi.advanceTimersByTimeAsync(700);
      expect(status).toHaveTextContent("");

      await vi.advanceTimersByTimeAsync(200);
      expect(status).toHaveTextContent("3 results");
    });
  });

  it("lists applied filters as chips and removes one", async () => {
    render(FilterPanel, {
      props: {
        withBar: true,
        value: { brand: ["Acme", "Bolt"], color: "red" },
      },
    });
    const bar = screen.getByTestId("bar");
    expect(
      within(bar)
        .getAllByRole("listitem")
        .map((li) => li.textContent?.trim()),
    ).toEqual(["Brand: Acme", "Brand: Bolt", "Color: red"]);

    await user.click(
      within(bar).getByRole("button", { name: "Remove filter Brand: Acme" }),
    );
    expect(value()).toEqual({ brand: ["Bolt"], color: "red" });
    // Focus moves to the chip that took its place.
    expect(
      within(bar).getByRole("button", { name: "Remove filter Brand: Bolt" }),
    ).toHaveFocus();
  });

  it("returns focus to the bar after Clear all", async () => {
    render(FilterPanel, {
      props: { withBar: true, value: { brand: ["Acme"] } },
    });
    const bar = screen.getByTestId("bar");
    await user.click(within(bar).getByRole("button", { name: "Clear all" }));

    expect(value()).toEqual({});
    expect(bar).toHaveFocus();
    expect(within(bar).getByText("No filters applied")).toBeInTheDocument();
  });
});
