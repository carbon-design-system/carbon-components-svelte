import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import IndexedList from "./IndexedList.test.svelte";

const headings = () =>
  screen
    .queryAllByRole("heading")
    .map((heading) => heading.textContent?.trim());

const letters = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".bx--indexed-list__index-button",
    ),
  );

const letter = (key: string) =>
  screen.getByRole("button", { name: new RegExp(`^Jump to ${key},`) });

describe("IndexedList", () => {
  it("files items under the locale's letters, # last, empty letters left out of the list", () => {
    render(IndexedList);

    expect(headings()).toEqual([
      "A (1)",
      "M (1)",
      "Z (1)",
      "Ä (1)",
      "Ö (1)",
      "# (1)",
    ]);
    // Sorted within a section and rendered through the slot.
    expect(screen.getAllByTestId("row").map((row) => row.textContent)).toEqual([
      "Anna",
      "Maja",
      "Zoe",
      "Ärlig",
      "Östen",
      "3 Musketeers",
    ]);
  });

  it("folds German umlauts into A and O", () => {
    render(IndexedList, { props: { locale: "de" } });

    expect(headings()).toEqual(["A (2)", "M (1)", "O (1)", "Z (1)", "# (1)"]);
  });

  it("is a list with every row positioned in the whole", () => {
    render(IndexedList);

    const rows = document.querySelectorAll(
      '.bx--indexed-list__list > [role="listitem"]',
    );
    // Six sections and six items, headers counted.
    expect(rows).toHaveLength(12);
    expect(rows[0]).toHaveAttribute("aria-posinset", "1");
    expect(rows[1]).toHaveAttribute("aria-posinset", "2");
    expect(rows[2]).toHaveAttribute("aria-posinset", "3");
    expect(rows[11]).toHaveAttribute("aria-posinset", "12");
    expect(rows[11]).toHaveAttribute("aria-setsize", "12");
    expect(screen.getByRole("region", { name: "List" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("puts a nav of letters beside it, one per section, empty ones disabled", () => {
    render(IndexedList);

    expect(screen.getByRole("navigation", { name: "Index" })).toBeVisible();
    // A to Z, Å, Ä, Ö, and #.
    expect(letters()).toHaveLength(30);
    expect(letter("M")).toHaveAccessibleName("Jump to M, 1 item");
    expect(letter("M")).not.toHaveAttribute("aria-disabled");
    expect(letter("B")).toHaveAttribute("aria-disabled", "true");
    expect(letter("B")).toHaveAccessibleName("Jump to B, 0 items");
  });

  it("has one tab stop on the rail, on the letter at the top", () => {
    render(IndexedList);

    expect(
      letters()
        .filter((button) => button.tabIndex === 0)
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Jump to A, 1 item"]);
    expect(letter("A")).toHaveAttribute("aria-current", "true");
  });

  it("moves by arrow, skipping letters with no items", async () => {
    render(IndexedList);

    letter("A").focus();
    await user.keyboard("{ArrowDown}");
    expect(letter("M")).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(letter("Ä")).toHaveFocus();
    await user.keyboard("{End}");
    expect(letter("#")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(letter("#")).toHaveFocus();
    await user.keyboard("{ArrowUp}{Home}");
    expect(letter("A")).toHaveFocus();
    // Focus alone does not scroll.
    expect(screen.getByRole("region").scrollTop).toBe(0);
  });

  it("jumps to the section and focuses its header on Enter", async () => {
    render(IndexedList);
    const scroller = screen.getByRole("region");

    letter("Z").focus();
    await user.keyboard("{Enter}");

    // Header 24 + 40, A and M above it: 2 * 64.
    expect(scroller.scrollTop).toBe(128);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Z (1)" })).toHaveFocus(),
    );
    expect(letter("Z")).toHaveAttribute("aria-current", "true");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Section Z, 1 item"),
    );
  });

  it("does nothing on a letter with no items", async () => {
    render(IndexedList);
    const scroller = screen.getByRole("region");

    letter("B").focus();
    await user.keyboard("{Enter}");

    expect(scroller.scrollTop).toBe(0);
    expect(screen.getByRole("heading", { name: "A (1)" })).not.toHaveFocus();
  });

  it("jumps to a letter typed on the rail", async () => {
    render(IndexedList);

    letter("A").focus();
    await user.keyboard("m");

    expect(letter("M")).toHaveFocus();
    expect(screen.getByRole("region").scrollTop).toBe(64);
    // A letter with no items stays put.
    await user.keyboard("b");
    expect(letter("M")).toHaveFocus();
  });

  it("scrolls to a section from code", async () => {
    render(IndexedList);
    const scroller = screen.getByRole("region");

    await user.click(screen.getByRole("button", { name: "go to B" }));
    expect(scroller.scrollTop).toBe(0);

    await user.click(screen.getByRole("button", { name: "go to M" }));
    expect(scroller.scrollTop).toBe(64);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "M (1)" })).toHaveFocus(),
    );
  });

  it("names letters and announcements with the props", async () => {
    render(IndexedList, {
      props: {
        rest: {
          jumpLabel: ({ key, count }: { key: string; count: number }) =>
            `${key}: ${count} contacts`,
          announcement: ({ key }: { key: string }) => `Now at ${key}`,
          indexLabelText: "Alphabet",
          labelText: "Contacts",
        },
      },
    });

    expect(screen.getByRole("navigation", { name: "Alphabet" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Contacts" })).toBeVisible();
    screen.getByRole("button", { name: "M: 1 contacts" }).focus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Now at M"),
    );
  });

  it("hides the rail and keeps the headers", () => {
    render(IndexedList, { props: { rest: { hideIndex: true } } });

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(headings()).toHaveLength(6);
  });

  it("shows the empty slot with no items", () => {
    render(IndexedList, { props: { items: [] } });

    expect(screen.getByText("No contacts")).toBeVisible();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("uses a custom groupBy and its keys, without a rail of empty letters", () => {
    render(IndexedList, {
      props: {
        rest: {
          groupBy: (item: { name: string }) =>
            item.name.length > 4 ? "Long" : "Short",
        },
      },
    });

    expect(headings()).toEqual(["Long (3)", "Short (3)"]);
    expect(letters().map((button) => button.textContent?.trim())).toEqual([
      "Long",
      "Short",
    ]);
  });

  it("forwards rest props to the scrolling region, the element that takes focus", () => {
    render(IndexedList, {
      props: { rest: { "aria-label": "Phone book", id: "contacts" } },
    });

    const region = screen.getByRole("region", { name: "Phone book" });
    expect(region).toHaveClass("bx--indexed-list__scroller");
    expect(region).toHaveAttribute("id", "contacts");
  });
});
