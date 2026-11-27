import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import AccordionSearch from "./AccordionSearch.test.svelte";

describe("AccordionSearch", () => {
  const headers = () =>
    screen
      .queryAllByRole("button")
      .filter((button) => button.classList.contains("bx--accordion__heading"));

  it("renders all items when filterText is empty", () => {
    render(AccordionSearch);

    expect(headers()).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Natural Language Understanding/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Language Translator/ }),
    ).toBeInTheDocument();
  });

  it("narrows items to those matching the query", async () => {
    render(AccordionSearch);

    await user.type(screen.getByRole("searchbox"), "Translator");

    expect(headers()).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /Language Translator/ }),
    ).toBeInTheDocument();
  });

  it("renders emptyText when nothing matches", async () => {
    render(AccordionSearch);

    await user.type(screen.getByRole("searchbox"), "zzzzqqq");

    expect(screen.getByText("No items match your search.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(headers()).toHaveLength(0);
  });

  it("restores all items when the query is cleared", async () => {
    render(AccordionSearch);

    const input = screen.getByRole("searchbox");
    await user.type(input, "Translator");
    expect(headers()).toHaveLength(1);

    await user.clear(input);
    expect(headers()).toHaveLength(3);
  });

  it("reflects the typed value through bind:filterText", async () => {
    const { component } = render(AccordionSearch);

    await user.type(screen.getByRole("searchbox"), "Translator");

    expect(component.filterText).toBe("Translator");
  });

  it("disables only the item marked disabled", () => {
    render(AccordionSearch, {
      props: {
        items: [
          { id: 1, title: "Alpha", description: "a" },
          { id: 2, title: "Beta", description: "b", disabled: true },
        ],
      },
    });

    expect(screen.getByRole("button", { name: /Beta/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Alpha/ })).toBeEnabled();
  });
});
