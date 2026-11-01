import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type CommandPaletteComponent from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import CommandPalette from "./CommandPalette.test.svelte";
import CommandPaletteAccessors from "./CommandPaletteAccessors.test.svelte";
import CommandPaletteGroups from "./CommandPaletteGroups.test.svelte";
import CommandPaletteSlot from "./CommandPaletteSlot.test.svelte";

function getInput() {
  const input = screen.getByRole("combobox");
  assert(input instanceof HTMLInputElement);
  return input;
}

function optionTexts() {
  return screen
    .getAllByRole("option")
    .map(
      (option) =>
        option.querySelector(".bx--command-palette__item-text")?.textContent,
    );
}

function highlighted() {
  const id = getInput().getAttribute("aria-activedescendant");
  return id ? document.getElementById(id) : null;
}

describe("CommandPalette", () => {
  it("renders a combobox and a listbox in a modal dialog", () => {
    render(CommandPalette);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Search commands");

    const input = getInput();
    const listbox = screen.getByRole("listbox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(listbox).toHaveAccessibleName("Search commands");
    expect(optionTexts()).toEqual([
      "Deploy service",
      "View logs",
      "Edit environment",
      "Delete service",
    ]);
  });

  it("highlights the first command so Enter runs the best match", async () => {
    render(CommandPalette);

    const first = screen.getAllByRole("option")[0];
    expect(highlighted()).toBe(first);
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(first).toHaveAttribute("aria-posinset", "1");
    expect(first).toHaveAttribute("aria-setsize", "4");

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("deploy");
    expect(screen.getByTestId("closed-by")).toHaveTextContent("select");
    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });

  it("filters with fuzzy matching, ranks the best match first and highlights it", async () => {
    render(CommandPalette);

    await user.type(getInput(), "serv");
    expect(optionTexts()).toEqual(["Deploy service", "Delete service"]);
    const match = screen
      .getAllByRole("option")[0]
      .querySelector(".bx--command-palette__match");
    expect(match).toHaveTextContent("serv");

    await user.clear(getInput());
    await user.type(getInput(), "edit");
    expect(optionTexts()[0]).toBe("Edit environment");
  });

  it("matches keywords and descriptions", async () => {
    render(CommandPalette);

    await user.type(getInput(), "tail");
    expect(optionTexts()).toEqual(["View logs"]);

    await user.clear(getInput());
    await user.type(getInput(), "secrets");
    expect(optionTexts()).toEqual(["Edit environment"]);
    const description = screen
      .getByRole("option")
      .querySelector(".bx--command-palette__item-description");
    expect(
      description?.querySelector(".bx--command-palette__match"),
    ).toHaveTextContent("secrets");
  });

  it("does not match scattered letters in a description", async () => {
    render(CommandPalette);

    // "Variables and secrets" holds v, a, s in order, but not as one run.
    await user.type(getInput(), "vas");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("keeps every item when shouldFilter is false", async () => {
    render(CommandPalette, { props: { shouldFilter: false } });

    await user.type(getInput(), "logs");
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(
      screen
        .getAllByRole("option")[1]
        .querySelector(".bx--command-palette__match"),
    ).toHaveTextContent("logs");
  });

  it("moves the highlight with the arrow keys and wraps", async () => {
    render(CommandPalette);
    const options = screen.getAllByRole("option");

    await user.keyboard("{ArrowDown}");
    expect(highlighted()).toBe(options[1]);
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(highlighted()).toBe(options[3]);
    await user.keyboard("{ArrowDown}");
    expect(highlighted()).toBe(options[0]);
    await user.keyboard("{PageDown}");
    expect(highlighted()).toBe(options[3]);
  });

  it("does not select a disabled command", async () => {
    render(CommandPalette);

    await user.keyboard("{ArrowUp}");
    expect(highlighted()).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Enter}");
    await user.click(screen.getByText("Delete service"));

    expect(screen.getByTestId("selected")).toHaveTextContent("");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("moves the highlight with the pointer and selects on click", async () => {
    render(CommandPalette);
    const logs = screen.getAllByRole("option")[1];

    await fireEvent.mouseMove(logs);
    expect(highlighted()).toBe(logs);

    await user.click(logs);
    expect(screen.getByTestId("selected")).toHaveTextContent("logs");
    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });

  it("stays open when select is canceled", async () => {
    render(CommandPalette, { props: { preventSelect: true } });

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("deploy");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("closes on Escape without clearing through Search first", async () => {
    render(CommandPalette);

    await user.type(getInput(), "logs");
    await user.keyboard("{Escape}");
    expect(screen.getByTestId("closed-by")).toHaveTextContent("escape-key");
    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });

  it("ignores Enter and Escape that belong to an IME composition", async () => {
    render(CommandPalette);
    const input = getInput();

    await fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    await fireEvent.keyDown(input, { key: "Escape", isComposing: true });

    expect(screen.getByTestId("selected")).toHaveTextContent("");
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it.each([
    [true, "false"],
    [false, "true"],
  ])(
    "closes on an outside click when closeOnOutsideClick is %s",
    async (closeOnOutsideClick, stillOpen) => {
      const { container } = render(CommandPalette, {
        props: { closeOnOutsideClick },
      });
      const root = container.querySelector(".bx--command-palette");
      assert(root);

      await fireEvent.mouseDown(root);
      await fireEvent.mouseUp(root);
      expect(screen.getByTestId("open")).toHaveTextContent(stillOpen);
    },
  );

  it("stays open when a press inside the dialog is released outside", async () => {
    const { container } = render(CommandPalette);
    const root = container.querySelector(".bx--command-palette");
    assert(root);

    await fireEvent.mouseDown(getInput());
    await fireEvent.mouseUp(root);
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("focuses the field on open, returns focus on close and clears the query", async () => {
    render(CommandPalette, { props: { open: false } });

    const trigger = screen.getByTestId("trigger");
    await user.click(trigger);
    await tick();
    expect(getInput()).toHaveFocus();
    expect(document.body).toHaveClass("bx--body--with-modal-open");
    expect(screen.getByTestId("opened-by")).toHaveTextContent("programmatic");

    await user.type(getInput(), "logs");
    await user.keyboard("{Escape}");
    await tick();
    await tick();
    expect(trigger).toHaveFocus();
    expect(getInput()).toHaveValue("");
    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("keeps Tab inside the dialog", async () => {
    render(CommandPalette, { props: { value: "logs" } });

    const clear = screen.getByRole("button", { name: "Clear search input" });
    await user.tab();
    expect(clear).toHaveFocus();
    await user.tab();
    expect(getInput()).toHaveFocus();
  });

  it("shows the no-results text and announces the result count", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(CommandPalette);
      await fireEvent.input(getInput(), { target: { value: "zzz" } });

      expect(screen.queryAllByRole("option")).toHaveLength(0);
      expect(screen.getByText("No results found")).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(800);
      expect(screen.getByRole("status")).toHaveTextContent("No results");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the empty text when there are no commands", () => {
    render(CommandPalette, { props: { items: [] } });

    expect(screen.getByText("No commands available")).toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("marks the list busy and shows a loading row", () => {
    render(CommandPalette, { props: { loading: true } });

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("marks the list busy at once and shows the loading row after loadingDelay", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { rerender } = render(CommandPalette, {
        props: { items: [], loadingDelay: 300 },
      });
      await rerender({ loading: true });

      expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(
        screen.queryByText("No commands available"),
      ).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(300);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("filters on every key and debounces only search", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(CommandPalette, { props: { debounce: 300 } });
      await fireEvent.input(getInput(), { target: { value: "logs" } });

      expect(optionTexts()).toEqual(["View logs"]);
      expect(screen.getByTestId("searched")).toHaveTextContent("");

      await vi.advanceTimersByTimeAsync(300);
      expect(screen.getByTestId("searched")).toHaveTextContent("logs");
    } finally {
      vi.useRealTimers();
    }
  });

  it("displays shortcuts as key caps with aria-keyshortcuts", () => {
    render(CommandPalette);

    const deploy = screen.getAllByRole("option")[0];
    const keys = [
      ...deploy.querySelectorAll(".bx--kbd__platform--other .bx--kbd__key"),
    ].map((key) => key.textContent);
    expect(keys).toEqual(["Ctrl", "D"]);
    expect(deploy).toHaveAttribute("aria-keyshortcuts", "Control+D");
    expect(
      deploy.querySelector(".bx--command-palette__shortcut"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("shows no key caps for a shortcut that does not parse", () => {
    render(CommandPalette, {
      props: { items: [{ id: "logs", text: "Logs", shortcut: "g l" }] },
    });

    const option = screen.getByRole("option");
    expect(option.querySelector(".bx--kbd")).toBeNull();
    expect(option).not.toHaveAttribute("aria-keyshortcuts");
  });

  it("renders a command with href as a link option", () => {
    render(CommandPalette, {
      props: { items: [{ id: "docs", text: "Read the docs", href: "/docs" }] },
    });

    const option = screen.getByRole("option");
    expect(option.tagName).toBe("A");
    expect(option).toHaveAttribute("href", "/docs");
  });

  it("renders only the rows in view for a large list", async () => {
    const items = Array.from({ length: 2000 }, (_, index) => ({
      id: index,
      text: `Service ${index}`,
    }));
    render(CommandPalette, { props: { items } });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeLessThan(50);
    expect(options[0]).toHaveAttribute("aria-setsize", "2000");

    await user.type(getInput(), "1999");
    expect(optionTexts()).toEqual(["Service 1999"]);
  });

  it("builds option ids from the palette id and the item's index", () => {
    render(CommandPalette, {
      props: {
        items: [
          { id: "deploy service", text: "Deploy service" },
          { id: "view logs", text: "View logs" },
        ],
      },
    });

    const ids = screen.getAllByRole("option").map((option) => option.id);
    expect(ids.every((id) => !/\s/.test(id))).toBe(true);
    expect(ids[1]).toBe(ids[0].replace(/-0$/, "-1"));
  });

  it("reads ids, labels and groups through the accessors", async () => {
    render(CommandPaletteAccessors);

    expect(screen.getAllByRole("group")[0]).toHaveAccessibleName("Payments");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent?.trim()),
    ).toEqual(["checkout-api", "billing-worker", "search-indexer"]);

    await user.type(getInput(), "bill");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("svc-2");
  });

  describe("groups", () => {
    it("renders labelled groups with a custom header", () => {
      render(CommandPaletteGroups);

      const groups = screen.getAllByRole("group");
      expect(
        groups.map((group) => group.getAttribute("aria-labelledby")),
      ).toHaveLength(2);
      expect(groups[0]).toHaveAccessibleName("Navigation");
      expect(within(groups[0]).getAllByRole("option")).toHaveLength(2);
      expect(screen.getByText("NAVIGATION")).toBeInTheDocument();
      // Ungrouped items come first.
      expect(screen.getAllByRole("option")[0]).toHaveTextContent("Help center");
    });

    it("orders groups by their best match while filtering", async () => {
      render(CommandPaletteGroups);

      await user.type(getInput(), "deploy");
      const groups = screen.getAllByRole("group");
      expect(groups[0]).toHaveAccessibleName("Actions");
      expect(groups[1]).toHaveAccessibleName("Navigation");
    });
  });

  describe("slots", () => {
    it("passes match segments to the default slot and the value to noResults", async () => {
      render(CommandPaletteSlot);

      await user.type(getInput(), "dep");
      const row = screen.getByTestId("row-deploy");
      expect(row.querySelector("u")).toHaveTextContent("Dep");
      expect(row).toHaveAttribute("data-highlighted", "true");
      expect(screen.getByText("Press Enter to run")).toBeInTheDocument();

      await user.type(getInput(), "zz");
      expect(screen.getByText("Nothing for depzz")).toBeInTheDocument();
    });
  });

  describe("Generics", () => {
    it("types items and the select payload", () => {
      type Command = { id: string; text: string; run: () => void };
      type Props = ComponentProps<CommandPaletteComponent<Command>>;
      type Events = ComponentEvents<CommandPaletteComponent<Command>>;

      expectTypeOf<Props["items"]>().toEqualTypeOf<
        ReadonlyArray<Command> | undefined
      >();
      expectTypeOf<
        Events["select"]["detail"]["item"]
      >().toEqualTypeOf<Command>();
    });

    it("reads items of any shape through the accessors", () => {
      type Service = { key: number; name: string; region: string };
      type Props = ComponentProps<CommandPaletteComponent<Service>>;

      expectTypeOf<NonNullable<Props["itemToString"]>>()
        .parameter(0)
        .toEqualTypeOf<Service>();
      expectTypeOf<NonNullable<Props["itemToGroup"]>>()
        .parameter(0)
        .toEqualTypeOf<Service>();
    });
  });
});
