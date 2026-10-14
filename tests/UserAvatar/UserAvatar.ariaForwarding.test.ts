import { render, screen } from "@testing-library/svelte";
import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";

describe("UserAvatar aria forwarding (tooltipText)", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  it("joins a consumer aria-describedby on the tooltip button", () => {
    render(UserAvatar, {
      props: {
        name: "Ada Lovelace",
        tooltipText: "Ada Lovelace",
        id: "avatar",
        "aria-describedby": "extra-help",
      },
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(button).toHaveAccessibleDescription(
      expect.stringMatching(/Extra help$/),
    );
    expect(document.getElementById("avatar")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the tooltip button with a consumer aria-labelledby", () => {
    render(UserAvatar, {
      props: {
        name: "Ada Lovelace",
        tooltipText: "Ada Lovelace",
        id: "avatar",
        "aria-labelledby": "external-name",
      },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(document.getElementById("avatar")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the tooltip button with a consumer aria-label", () => {
    render(UserAvatar, {
      props: {
        name: "Ada Lovelace",
        tooltipText: "Ada Lovelace",
        id: "avatar",
        "aria-label": "Consumer label",
      },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(document.getElementById("avatar")).not.toHaveAttribute("aria-label");
  });
});
