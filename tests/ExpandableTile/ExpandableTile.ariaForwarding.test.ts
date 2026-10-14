import { render, screen } from "@testing-library/svelte";
import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";

describe("ExpandableTile aria forwarding (hasInteractiveContent)", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  it("places a consumer aria-describedby on the chevron button", () => {
    render(ExpandableTile, {
      props: {
        hasInteractiveContent: true,
        id: "tile",
        "aria-describedby": "extra-help",
      },
    });

    const button = screen.getByRole("button", {
      name: "Interact to expand Tile",
    });
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
    expect(document.getElementById("tile")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the chevron button with a consumer aria-labelledby", () => {
    render(ExpandableTile, {
      props: {
        hasInteractiveContent: true,
        id: "tile",
        "aria-labelledby": "external-name",
      },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(document.getElementById("tile")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("lets a consumer aria-label win over the icon text", () => {
    render(ExpandableTile, {
      props: {
        hasInteractiveContent: true,
        id: "tile",
        "aria-label": "Show more details",
      },
    });

    expect(
      screen.getByRole("button", { name: "Show more details" }),
    ).toBeInTheDocument();
    expect(document.getElementById("tile")).not.toHaveAttribute("aria-label");
  });

  it("keeps the attributes on the tile button without interactive content", () => {
    render(ExpandableTile, {
      props: { id: "tile", "aria-describedby": "extra-help" },
    });

    expect(document.getElementById("tile")).toHaveAttribute(
      "aria-describedby",
      "extra-help",
    );
  });
});
