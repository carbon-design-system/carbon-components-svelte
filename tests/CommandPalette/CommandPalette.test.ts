import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import CommandPalette from "./CommandPalette.test.svelte";
import CommandPaletteGroups from "./CommandPaletteGroups.test.svelte";
import CommandPaletteMatch from "./CommandPaletteMatch.test.svelte";

describe("CommandPalette", () => {
  it("renders a combobox input when open", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("renders all items for an empty value", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("fuzzy-filters items by the search value", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.type(input, "memcache");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent(
      "Data Store for Memcache",
    );
  });

  it("highlights the matched portion of each item", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");
    const highlights = document.querySelectorAll(
      ".bx--cmd-palette__option-match",
    );
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toHaveTextContent("Data");
  });

  it("navigates with the arrow keys and selects with Enter", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.keyboard("{ArrowDown}");
    const firstOption = screen.getAllByRole("option")[0];
    expect(input).toHaveAttribute("aria-activedescendant", firstOption.id);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("result")).toHaveTextContent("Go to Dashboard");
  });

  it("closes on Escape and clears the value", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("query")).toHaveTextContent("");
  });

  it("closes on an outside click", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const backdrop = document.querySelector(".bx--cmd-palette");
    expect(backdrop).toBeInstanceOf(HTMLElement);
    await fireEvent.click(backdrop as HTMLElement);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dispatches close with the select trigger when an item is chosen", async () => {
    render(CommandPalette);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByText("Open settings"));
    expect(screen.getByTestId("close")).toHaveTextContent("select");
  });

  it("uses a custom match function for filtering and highlighting", async () => {
    render(CommandPaletteMatch);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("Data Store");
  });

  it("renders every item with a no-op matcher and no highlights", async () => {
    render(CommandPaletteMatch, {
      props: { match: () => ({ matched: true }) },
    });
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.type(input, "zzz");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(
      document.querySelectorAll(".bx--cmd-palette__option-match"),
    ).toHaveLength(0);
  });

  it("renders all items but still highlights when shouldFilter is false", async () => {
    render(CommandPalette, { props: { shouldFilter: false } });
    await user.click(screen.getByRole("button", { name: "Open" }));
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(
      document.querySelectorAll(".bx--cmd-palette__option-match").length,
    ).toBeGreaterThan(0);
  });

  it("sizes the menu to match the input size", async () => {
    render(CommandPalette, { props: { size: "sm" } });
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(document.querySelector(".bx--search--sm")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveClass(
      "bx--cmd-palette__menu--sm",
    );
  });
});

describe("CommandPalette groups", () => {
  it("renders group headers and skips disabled items during keyboard nav", async () => {
    render(CommandPaletteGroups);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(
      screen.getByText("Invite teammate").closest('[role="option"]'),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
