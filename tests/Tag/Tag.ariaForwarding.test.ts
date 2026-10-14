import { render, screen } from "@testing-library/svelte";
import Tag from "carbon-components-svelte/Tag/Tag.svelte";

describe("Tag aria forwarding (filter)", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  it("places a consumer aria-describedby on the close button", () => {
    render(Tag, {
      props: {
        filter: true,
        type: "red",
        id: "tag",
        "aria-describedby": "extra-help",
      },
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
    expect(document.getElementById("tag")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the close button with a consumer aria-labelledby", () => {
    render(Tag, {
      props: {
        filter: true,
        type: "red",
        id: "tag",
        "aria-labelledby": "external-name",
      },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(document.getElementById("tag")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("lets a consumer aria-label replace the built-in labelledby", () => {
    render(Tag, {
      props: {
        filter: true,
        type: "red",
        id: "tag",
        "aria-label": "Remove red filter",
      },
    });

    const button = screen.getByRole("button", { name: "Remove red filter" });
    expect(button).not.toHaveAttribute("aria-labelledby");
    expect(document.getElementById("tag")).not.toHaveAttribute("aria-label");
  });

  it("keeps the built-in name without consumer naming", () => {
    render(Tag, { props: { filter: true, type: "red", id: "tag" } });

    expect(
      screen.getByRole("button", { name: "Clear filter red" }),
    ).toBeInTheDocument();
  });
});
