import { render, screen } from "@testing-library/svelte";
import Button from "carbon-components-svelte/Button/Button.svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";

describe("Button tooltipAlign", () => {
  it.each([
    ["top", "top", "center"],
    ["top-start", "top", "start"],
    ["bottom-end", "bottom", "end"],
    ["left-start", "left", "start"],
    ["right", "right", "center"],
  ] as const)(
    "places a %s tooltip %s, aligned %s",
    (tooltipAlign, side, edge) => {
      render(Button, {
        props: { icon: Add, iconDescription: "Add", tooltipAlign },
      });

      const button = screen.getByRole("button", { name: "Add" });
      expect(button).toHaveClass(
        `bx--btn--icon-only--${side}`,
        `bx--tooltip--align-${edge}`,
      );
    },
  );

  it("takes precedence over tooltipPosition and tooltipAlignment", () => {
    render(Button, {
      props: {
        icon: Add,
        iconDescription: "Add",
        tooltipAlign: "top-end",
        tooltipPosition: "left",
        tooltipAlignment: "start",
      },
    });

    const button = screen.getByRole("button", { name: "Add" });
    expect(button).toHaveClass(
      "bx--btn--icon-only--top",
      "bx--tooltip--align-end",
    );
    expect(button).not.toHaveClass("bx--btn--icon-only--left");
    expect(button).not.toHaveClass("bx--tooltip--align-start");
  });

  it("keeps the older props when tooltipAlign is unset", () => {
    render(Button, {
      props: {
        icon: Add,
        iconDescription: "Add",
        tooltipPosition: "left",
        tooltipAlignment: "start",
      },
    });

    expect(screen.getByRole("button", { name: "Add" })).toHaveClass(
      "bx--btn--icon-only--left",
      "bx--tooltip--align-start",
    );
  });
});
