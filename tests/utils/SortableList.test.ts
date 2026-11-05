import { render, screen } from "@testing-library/svelte";
import SortableList from "./SortableList.test.svelte";
import { user } from "./user";

const names = () =>
  screen
    .getAllByRole("listitem")
    .map((item) => item.querySelector("span")?.textContent);

describe("sortable in a component", () => {
  it("reorders a keyed list through the sort event", async () => {
    render(SortableList);

    screen.getByRole("button", { name: "Move Alpha" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard(" ");

    expect(names()).toEqual(["Bravo", "Charlie", "Alpha"]);
  });

  it("keeps the order when the consumer prevents the event", async () => {
    render(SortableList, { veto: true });

    screen.getByRole("button", { name: "Move Alpha" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");

    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
  });
});
