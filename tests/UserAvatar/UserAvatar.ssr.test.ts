// @vitest-environment node
import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";

describe("UserAvatar server render", () => {
  const props = { id: "ada", name: "Ada Lovelace", tooltipText: "Ada" };

  it("renders identical markup with a tooltip for an explicit id", () => {
    const renderRaw = () => render(UserAvatar, { props }).body;

    expect(renderRaw()).toBe(renderRaw());
  });

  it("derives the tooltip id from the id", () => {
    const { document } = renderSSR(UserAvatar, props);

    expect(document.getElementById("ada")).toHaveClass("bx--user-avatar");
    expect(document.querySelector("[aria-describedby]")).toHaveAttribute(
      "aria-describedby",
      "ada-tooltip",
    );
  });
});
