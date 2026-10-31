import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import TransferList from "./TransferList.test.svelte";

const available = () => screen.getByRole("listbox", { name: "Available" });
const selected = () => screen.getByRole("listbox", { name: "Selected" });
const names = (list: HTMLElement) =>
  within(list)
    .queryAllByRole("option")
    .map((option) => option.textContent?.trim());
const value = () => screen.getByTestId("selected").textContent;

describe("TransferList", () => {
  it("splits items into the two lists, selected in order", () => {
    render(TransferList, { selectedIds: ["e", "a"] });

    expect(names(selected())).toEqual(["Echo", "Alpha"]);
    expect(names(available())).toEqual(["Bravo", "Charlie", "Delta"]);
    expect(available()).toHaveAttribute("aria-multiselectable", "true");
  });

  it("moves the marked items with the add button and reports it", async () => {
    render(TransferList);

    await user.click(within(available()).getByText("Alpha"));
    await user.click(within(available()).getByText("Charlie"));
    await user.click(
      screen.getByRole("button", { name: "Add selected items" }),
    );

    expect(value()).toBe("b,a,c");
    expect(screen.getByTestId("changes")).toHaveTextContent("add:a,c");
    expect(
      screen.getByText("2 items added to the selected list."),
    ).toBeInTheDocument();
  });

  it("dispatches a cancelable move with from, to and the next selection", async () => {
    render(TransferList);

    await user.click(within(available()).getByText("Alpha"));
    await user.click(
      screen.getByRole("button", { name: "Add selected items" }),
    );
    selected().focus();
    await user.keyboard("{End}{Alt>}{ArrowUp}{/Alt}{Delete}");

    expect(screen.getByTestId("moves")).toHaveTextContent(
      "available>selected:a=b,a|selected>selected:a=a,b|selected>available:a=b",
    );
    expect(value()).toBe("b");
  });

  it("keeps the lists as they are when a move is canceled", async () => {
    render(TransferList, { cancelMoves: true });

    await user.click(within(available()).getByText("Alpha"));
    await user.click(
      screen.getByRole("button", { name: "Add selected items" }),
    );
    await user.click(screen.getByRole("button", { name: "Remove all items" }));

    expect(screen.getByTestId("moves")).toHaveTextContent(
      "available>selected:a=b,a|selected>available:b=",
    );
    expect(value()).toBe("b");
    expect(names(available())).toEqual(["Alpha", "Charlie", "Delta", "Echo"]);
    expect(screen.getByTestId("changes")).toHaveTextContent("");
  });

  it("moves every enabled item with the all buttons", async () => {
    render(TransferList);

    await user.click(screen.getByRole("button", { name: "Add all items" }));
    // Delta is disabled, so it stays.
    expect(value()).toBe("b,a,c,e");
    expect(names(available())).toEqual(["Delta"]);

    await user.click(screen.getByRole("button", { name: "Remove all items" }));
    expect(value()).toBe("");
  });

  it("selects a range with Shift, skipping a disabled item, and moves it with Enter", async () => {
    render(TransferList);

    available().focus();
    await user.keyboard("{ArrowDown}{Shift>}{ArrowDown}{/Shift}");
    expect(
      within(available())
        .getAllByRole("option")
        .map((option) => option.getAttribute("aria-selected")),
    ).toEqual(["false", "true", "false", "true"]);

    await user.keyboard("{Enter}");
    expect(value()).toBe("b,c,e");
  });

  it("keeps the cursor on the next row after a move", async () => {
    render(TransferList);

    // Alpha, Charlie, Delta, Echo: the cursor starts on Alpha.
    available().focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(value()).toBe("b,c");

    // Charlie left, so the cursor skips the disabled Delta to Echo.
    const echo = within(available()).getByText("Echo").closest("[role=option]");
    expect(available()).toHaveAttribute("aria-activedescendant", echo?.id);

    await user.keyboard("{ArrowUp}");
    const alpha = within(available())
      .getByText("Alpha")
      .closest("[role=option]");
    expect(available()).toHaveAttribute("aria-activedescendant", alpha?.id);
  });

  it("toggles the row under the cursor with Space and clears with Escape", async () => {
    render(TransferList);

    available().focus();
    await user.keyboard("{ArrowDown} ");
    expect(
      within(available()).getByText("Charlie").closest("[role=option]"),
    ).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Escape}");
    expect(
      within(available()).getByText("Charlie").closest("[role=option]"),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("moves the cursor row when nothing is marked, and Delete returns it", async () => {
    render(TransferList, { selectedIds: ["a", "b"] });

    selected().focus();
    await user.keyboard("{Delete}");

    expect(value()).toBe("b");
  });

  it("reorders the marked items with Alt and the arrow keys", async () => {
    render(TransferList, { selectedIds: ["a", "b", "c"] });

    selected().focus();
    await user.keyboard("{ArrowDown}{ArrowDown} ");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(value()).toBe("a,c,b");
    expect(screen.getByTestId("changes")).toHaveTextContent("reorder:c");
  });

  it("reorders with the buttons, which wait for a mark", async () => {
    render(TransferList, { selectedIds: ["a", "b", "c"] });
    const down = screen.getByRole("button", { name: "Move down" });

    expect(down).toBeDisabled();
    await user.click(within(selected()).getByText("Alpha"));
    await user.click(down);

    expect(value()).toBe("b,a,c");
  });

  it("never moves a disabled item", async () => {
    render(TransferList);

    await user.click(within(available()).getByText("Delta"));
    expect(
      screen.getByRole("button", { name: "Add selected items" }),
    ).toBeDisabled();
  });

  it("searches each list on its own, and the all buttons follow the search", async () => {
    render(TransferList, { filterable: true });

    await user.type(
      screen.getByRole("searchbox", { name: "Search available items" }),
      "ho",
    );
    expect(names(available())).toEqual(["Echo"]);

    await user.click(screen.getByRole("button", { name: "Add all items" }));
    expect(value()).toBe("b,e");
    expect(names(selected())).toEqual(["Bravo", "Echo"]);
  });

  it("submits the selected ids in order under name, and resets", async () => {
    const { container } = render(TransferList, {
      selectedIds: ["c", "a"],
      name: "teams",
    });
    const inputs = () =>
      [
        ...container.querySelectorAll<HTMLInputElement>('input[name="teams"]'),
      ].map((input) => input.value);

    expect(inputs()).toEqual(["c", "a"]);

    await user.click(screen.getByRole("button", { name: "Add all items" }));
    expect(inputs()).toEqual(["c", "a", "b", "e"]);
  });

  it("restores the starting selection when the form resets", async () => {
    render(TransferList, { selectedIds: ["a"], name: "teams" });

    await user.click(screen.getByRole("button", { name: "Add all items" }));
    expect(value()).toBe("a,b,c,e");

    await user.click(screen.getByRole("button", { name: "Reset form" }));
    await vi.waitFor(() => expect(value()).toBe("a"));
  });

  it("does nothing when read-only, and says so", async () => {
    render(TransferList, { readonly: true });

    await user.click(within(available()).getByText("Alpha"));
    expect(
      screen.getByRole("button", { name: "Add selected items" }),
    ).toBeDisabled();
    expect(selected()).toHaveAttribute("aria-readonly", "true");
    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });

  it("blocks a submission with nothing selected and shows why", async () => {
    render(TransferList, { selectedIds: [], required: true });

    await user.click(screen.getByRole("button", { name: "Submit form" }));

    expect(await screen.findByText("Select at least one item")).toBeVisible();
    expect(selected()).toHaveAttribute("aria-invalid", "true");
  });
});
