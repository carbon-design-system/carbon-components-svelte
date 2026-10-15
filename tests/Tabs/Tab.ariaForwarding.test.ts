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

  it("keeps the icon-only label when no consumer aria-label is set", () => {
    render(TabAria, { props: { iconOnly: true } });

    expect(screen.getByRole("tab", { name: "Calendar" })).toHaveAttribute(
      "aria-label",
      "Calendar",
    );
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

  it("points aria-controls at its panel by default", () => {
    render(TabAria);

    const tab = screen.getByRole("tab", { name: "Calendar" });
    const panelId = tab.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toHaveAttribute(
      "role",
      "tabpanel",
    );
  });
});
