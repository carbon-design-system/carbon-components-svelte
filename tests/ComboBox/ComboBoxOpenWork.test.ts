import { render, screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { user } from "../utils/user";
import { getInput } from "./helpers";

// Opening a long list must not do per-item work beyond what the mounted
// options need. `idReads` counts `item.id` reads, which an id-to-position map
// over every item makes once per item.
describe("ComboBox open work on long lists", () => {
  const COUNT = 3000;

  const buildItems = () => {
    const state = { idReads: 0 };
    const items = Array.from({ length: COUNT }, (_, i) => {
      const item = { text: `Item ${i}` } as { id: string; text: string };
      Object.defineProperty(item, "id", {
        enumerable: true,
        get() {
          state.idReads++;
          return String(i);
        },
      });
      return item;
    });
    return { items, state };
  };

  it("does not read every item's id when opened virtualized", async () => {
    const { items, state } = buildItems();
    render(ComboBox, { props: { items, placeholder: "Pick" } });
    state.idReads = 0;

    await user.click(getInput());

    expect(screen.getAllByRole("option").length).toBeLessThan(COUNT);
    expect(state.idReads).toBeLessThan(COUNT / 2);
  });

  it("highlights a hovered option without reading every item's id", async () => {
    const { items, state } = buildItems();
    render(ComboBox, { props: { items, placeholder: "Pick" } });
    await user.click(getInput());
    state.idReads = 0;

    const option = screen.getAllByRole("option")[2];
    await user.hover(option);

    expect(getInput()).toHaveAttribute("aria-activedescendant", option.id);
    expect(state.idReads).toBeLessThan(COUNT / 2);
  });

  it("still maps hovered options to their position when not virtualized", async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      text: `Item ${i}`,
    }));
    render(ComboBox, {
      props: { items, placeholder: "Pick", virtualize: false },
    });
    await user.click(getInput());

    const option = screen.getAllByRole("option")[7];
    expect(option).toHaveAttribute("aria-posinset", "8");
    await user.hover(option);

    expect(getInput()).toHaveAttribute("aria-activedescendant", option.id);
  });
});
