import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ListDetailLayout from "./ListDetailLayout.test.svelte";

// jsdom has no layout, so every element reports no boxes. The layout asks
// whether its divider is hidden to learn that the panes stack: a box for
// the root and none for the divider is the stacked layout.
function stackPanes(stacked: boolean) {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    function (this: HTMLElement) {
      const hidden =
        this.classList.contains("bx--splitter__separator") && stacked;
      return (hidden ? [] : [{}]) as unknown as DOMRectList;
    },
  );
}

async function settle() {
  await tick();
  await tick();
}

function link(name: string) {
  return screen.getByRole("link", { name });
}

describe("ListDetailLayout", () => {
  beforeEach(() => {
    history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the empty state until something is selected", async () => {
    render(ListDetailLayout);

    expect(
      screen.getByRole("heading", { name: "Select a ticket" }),
    ).toBeVisible();
    await user.click(link("Export hangs at 90%"));

    expect(
      screen.queryByRole("heading", { name: "Select a ticket" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Export hangs at 90%" }),
    ).toBeVisible();
  });

  it("marks the selected link current and names both regions", async () => {
    render(ListDetailLayout);
    await user.click(link("Dark theme contrast"));

    expect(link("Dark theme contrast")).toHaveAttribute("aria-current", "true");
    expect(link("Login fails on Safari")).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("region", { name: "Tickets" })).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Dark theme contrast" }),
    ).toBeVisible();
  });

  it("links each item to ?id= so it opens in a new tab", () => {
    history.replaceState(null, "", "/inbox?folder=open#top");
    render(ListDetailLayout);

    expect(link("Login fails on Safari")).toHaveAttribute(
      "href",
      "?folder=open&id=101#top",
    );
  });

  it("leaves a modified click to the browser", async () => {
    const onChange = vi.fn();
    render(ListDetailLayout, { onChange });
    // jsdom cannot navigate; this only keeps it from logging that.
    document.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });

    await user.keyboard("{Control>}");
    await user.click(link("Login fails on Safari"));
    await user.keyboard("{/Control}");

    expect(onChange).not.toHaveBeenCalled();
    expect(location.search).toBe("");
  });

  describe("URL", () => {
    it("restores the selection from the URL on mount", async () => {
      history.replaceState(null, "", "/?id=103");
      const onChange = vi.fn();
      render(ListDetailLayout, { onChange });
      await settle();

      expect(link("Dark theme contrast")).toHaveAttribute(
        "aria-current",
        "true",
      );
      expect(onChange).toHaveBeenCalledWith("103");
    });

    it("adds an entry for the first selection and replaces for the next", async () => {
      render(ListDetailLayout);
      const before = history.length;

      await user.click(link("Login fails on Safari"));
      expect(location.search).toBe("?id=101");
      expect(history.length).toBe(before + 1);

      await user.click(link("Export hangs at 90%"));
      expect(location.search).toBe("?id=102");
      expect(history.length).toBe(before + 1);
    });

    it("adds an entry for every selection with historyMode push", async () => {
      render(ListDetailLayout, { historyMode: "push" });
      const before = history.length;

      await user.click(link("Login fails on Safari"));
      await user.click(link("Export hangs at 90%"));

      expect(history.length).toBe(before + 2);
    });

    it("follows browser back and forward", async () => {
      render(ListDetailLayout);
      await user.click(link("Login fails on Safari"));
      expect(link("Login fails on Safari")).toHaveAttribute("aria-current");

      history.back();
      await vi.waitFor(() =>
        expect(link("Login fails on Safari")).not.toHaveAttribute(
          "aria-current",
        ),
      );
      expect(
        screen.getByRole("heading", { name: "Select a ticket" }),
      ).toBeVisible();

      history.forward();
      await vi.waitFor(() =>
        expect(link("Login fails on Safari")).toHaveAttribute("aria-current"),
      );
    });

    it("leaves the URL alone with syncUrl off", async () => {
      history.replaceState(null, "", "/?id=103");
      render(ListDetailLayout, { syncUrl: false });
      await user.click(link("Login fails on Safari"));

      expect(location.search).toBe("?id=103");
      expect(link("Login fails on Safari")).toHaveAttribute("aria-current");
    });

    it("writes a selectedId set from outside with replace", async () => {
      const { rerender } = render(ListDetailLayout);
      const before = history.length;
      await rerender({ selectedId: "102" });
      await settle();

      expect(location.search).toBe("?id=102");
      expect(history.length).toBe(before);
    });
  });

  describe("one pane", () => {
    beforeEach(() => stackPanes(true));

    it("moves focus to the details heading on select", async () => {
      render(ListDetailLayout);
      await user.click(link("Export hangs at 90%"));
      await settle();

      expect(
        screen.getByRole("heading", { name: "Export hangs at 90%" }),
      ).toHaveFocus();
    });

    it("Back returns focus to the item and steps back through history", async () => {
      render(ListDetailLayout);
      const before = history.length;
      await user.click(link("Export hangs at 90%"));
      await settle();
      expect(history.length).toBe(before + 1);

      await user.click(screen.getByRole("button", { name: "Back to list" }));
      await vi.waitFor(() => expect(location.search).toBe(""));
      await settle();

      expect(link("Export hangs at 90%")).toHaveFocus();
      expect(link("Export hangs at 90%")).not.toHaveAttribute("aria-current");
    });

    it("Back on a deep link clears the selection and stays on the page", async () => {
      history.replaceState(null, "", "/?id=102");
      render(ListDetailLayout);
      await settle();
      const before = history.length;

      await user.click(screen.getByRole("button", { name: "Back to list" }));
      await settle();

      expect(location.search).toBe("");
      expect(history.length).toBe(before);
      expect(link("Export hangs at 90%")).toHaveFocus();
    });
  });

  it("announces the details beside the list instead of moving focus", async () => {
    stackPanes(false);
    render(ListDetailLayout);
    await user.click(link("Export hangs at 90%"));
    await settle();

    expect(link("Export hangs at 90%")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Export hangs at 90%");
  });

  it("marks the details busy and shows a skeleton while loading", () => {
    history.replaceState(null, "", "/?id=101");
    const { container } = render(ListDetailLayout, { loading: true });

    expect(container.querySelector(".bx--list-detail__body")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(container.querySelector(".bx--skeleton__text")).not.toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Login fails on Safari" }),
    ).toBeNull();
  });

  describe("keyboard", () => {
    it("keeps one tab stop in the list, on the selected item", async () => {
      history.replaceState(null, "", "/?id=102");
      render(ListDetailLayout);
      await settle();

      const stops = screen
        .getAllByRole("link")
        .filter((item) => item.getAttribute("tabindex") === "0");
      expect(stops).toEqual([link("Export hangs at 90%")]);
    });

    it("moves between items with the arrow keys, Home and End", async () => {
      render(ListDetailLayout);
      await settle();
      link("Login fails on Safari").focus();

      await user.keyboard("{ArrowDown}");
      expect(link("Export hangs at 90%")).toHaveFocus();
      await user.keyboard("{End}");
      expect(link("Dark theme contrast")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(link("Dark theme contrast")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(link("Login fails on Safari")).toHaveFocus();
    });

    it("opens the details with Enter", async () => {
      render(ListDetailLayout);
      link("Export hangs at 90%").focus();
      await user.keyboard("{Enter}");

      expect(location.search).toBe("?id=102");
      expect(link("Export hangs at 90%")).toHaveAttribute("aria-current");
    });
  });
});
