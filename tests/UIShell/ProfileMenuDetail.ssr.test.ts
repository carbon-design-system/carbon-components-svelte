// @vitest-environment node
import ProfileMenuDetail from "carbon-components-svelte/UIShell/ProfileMenuDetail.svelte";
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";

describe("ProfileMenuDetail server render", () => {
  const props = { id: "plan", label: "Plan" };

  it("renders identical markup for an explicit id", () => {
    const renderRaw = () => render(ProfileMenuDetail, { props }).body;

    expect(renderRaw()).toBe(renderRaw());
  });

  it("derives the label id from the id", () => {
    const { document } = renderSSR(ProfileMenuDetail, props);

    expect(document.getElementById("plan")).toHaveClass(
      "bx--profile-menu__detail",
    );
    expect(document.getElementById("plan-label")).toHaveTextContent("Plan");
    expect(
      document.querySelector(".bx--profile-menu__detail-value"),
    ).toHaveAttribute("aria-labelledby", "plan-label");
  });
});
