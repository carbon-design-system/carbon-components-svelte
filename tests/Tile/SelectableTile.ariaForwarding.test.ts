import { render, screen } from "@testing-library/svelte";
import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

describe("SelectableTile aria forwarding", () => {
  it("puts a consumer aria-describedby on the checkbox input", () => {
    const { container } = render(SelectableTile, {
      props: { "aria-describedby": "extra-help" },
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute("aria-describedby", "extra-help");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      input,
    ]);
  });

  it("names the checkbox input with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Starter plan");
    const { container } = render(SelectableTile, {
      props: { "aria-labelledby": "ext-label" },
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAccessibleName("Starter plan");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      input,
    ]);
  });

  it("names the checkbox input with a consumer aria-label", () => {
    const { container } = render(SelectableTile, {
      props: { "aria-label": "Starter plan" },
    });

    expect(screen.getByRole("checkbox")).toHaveAccessibleName("Starter plan");
    expect(container.querySelector("label")).not.toHaveAttribute("aria-label");
  });
});
