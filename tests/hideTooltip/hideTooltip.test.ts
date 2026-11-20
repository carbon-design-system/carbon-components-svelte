import { render, screen } from "@testing-library/svelte";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import HideTooltip from "./hideTooltip.test.svelte";

const cases = [
  { component: "copy", name: "Copy region" },
  { component: "password", name: "Show password" },
  { component: "password", name: "Show password", portalTooltip: true },
  { component: "toggle", name: "Add" },
  { component: "header", name: "Notifications" },
] as const;

function noTooltip() {
  expect(document.querySelector(".bx--tooltip--visible")).toBeNull();
  expect(openTooltips()).toHaveLength(0);
}

describe.each(cases)("hideTooltip on $component", (props) => {
  it("shows no tooltip on hover or focus and keeps the name", async () => {
    render(HideTooltip, { props });
    const trigger = screen.getByRole("button", { name: props.name });
    expect(trigger).not.toHaveClass("bx--tooltip__trigger");

    await user.hover(trigger);
    await new Promise((resolve) => setTimeout(resolve, 300));
    noTooltip();

    await user.unhover(trigger);
    trigger.focus();
    await new Promise((resolve) => setTimeout(resolve, 300));
    noTooltip();
  });

  it("still shows the tooltip without hideTooltip", async () => {
    render(HideTooltip, { props: { ...props, hideTooltip: false } });
    const trigger = screen.getByRole("button", { name: props.name });

    await user.hover(trigger);
    await vi.waitFor(() =>
      expect(
        openTooltips().length +
          document.querySelectorAll(".bx--tooltip--visible").length,
      ).toBe(1),
    );
  });
});
