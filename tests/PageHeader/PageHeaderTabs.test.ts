import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import PageHeaderTabs from "./PageHeaderTabs.test.svelte";

describe("PageHeader tabs with body panels", () => {
  it("renders body panels after the header, outside it", () => {
    render(PageHeaderTabs);

    const header = screen.getByTestId("header");
    const body = header.nextElementSibling;
    expect(body).toHaveClass("bx--page-header__body");
    expect(header).not.toContainElement(screen.getByTestId("overview"));
    expect(body).toContainElement(screen.getByTestId("overview"));
  });

  it("renders tabsEnd after the tabs in the tabs row", () => {
    render(PageHeaderTabs);

    const row = screen
      .getByTestId("header")
      .querySelector(".bx--page-header__tabs-row");
    const end = row?.lastElementChild;
    expect(end).toHaveClass("bx--page-header__tabs-end");
    expect(end).toContainElement(
      screen.getByRole("button", { name: "Last 24 hours" }),
    );
    expect(end?.previousElementSibling).toHaveClass("bx--tabs");
    expect(row).toHaveClass("bx--page-header__tabs-row--with-end");
  });

  it("keeps the divider and no container marker for default tabs", async () => {
    render(PageHeaderTabs);
    await tick();

    const header = screen.getByTestId("header");
    expect(header).toHaveClass("bx--page-header--divider");
    expect(header).not.toHaveClass("bx--page-header--container-tabs");
  });

  it("pairs body panels with the header tabs, skipping nested panels", async () => {
    render(PageHeaderTabs);
    await tick();

    const pairs = [
      ["Overview", "overview"],
      ["Backups", "backups"],
    ];
    for (const [name, testId] of pairs) {
      const tab = screen.getByRole("tab", { name });
      const panel = screen.getByTestId(testId);
      expect(panel).toHaveAttribute("role", "tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);
      expect(tab).toHaveAttribute("aria-controls", panel.id);
    }
  });

  it("shows the matching panel when a header tab is selected", async () => {
    render(PageHeaderTabs);
    await tick();

    expect(screen.getByTestId("overview")).not.toHaveAttribute("hidden");
    expect(screen.getByTestId("backups")).toHaveAttribute("hidden");

    await user.click(screen.getByRole("tab", { name: "Backups" }));

    expect(screen.getByTestId("overview")).toHaveAttribute("hidden");
    expect(screen.getByTestId("backups")).not.toHaveAttribute("hidden");
  });

  it("keeps tabs nested in a panel independent of the header tabs", async () => {
    render(PageHeaderTabs);
    await tick();

    await user.click(screen.getByRole("tab", { name: "Weekly" }));

    expect(screen.getByText("Weekly panel")).not.toHaveAttribute("hidden");
    expect(screen.getByText("Daily panel")).toHaveAttribute("hidden");
    expect(screen.getByTestId("overview")).not.toHaveAttribute("hidden");
    expect(screen.getByTestId("backups")).toHaveAttribute("hidden");
  });
});
