import { render, screen } from "@testing-library/svelte";
import TabAria from "./Tab.ariaForwarding.test.svelte";

describe("Tab aria forwarding", () => {
  it("lets a consumer aria-label win over the icon-only label", () => {
    render(TabAria, {
      props: { iconOnly: true, tabProps: { "aria-label": "Consumer label" } },
    });

    expect(
      screen.getByRole("tab", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tab-item")).not.toHaveAttribute("aria-label");
  });

  it("places a consumer aria-controls on the tab", () => {
    render(TabAria, {
      props: { tabProps: { "aria-controls": "external-panel" } },
    });

    expect(screen.getByRole("tab", { name: "Calendar" })).toHaveAttribute(
      "aria-controls",
      "external-panel",
    );
    expect(screen.getByTestId("tab-item")).not.toHaveAttribute("aria-controls");
  });
});
