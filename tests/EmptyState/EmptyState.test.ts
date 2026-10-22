import { render, screen } from "@testing-library/svelte";
import EmptyStateComponent from "../../src/EmptyState/EmptyState.svelte";
import EmptyState from "./EmptyState.test.svelte";
import EmptyStateTitleChildren from "./EmptyState.titleChildren.test.svelte";
import EmptyStateInSection from "./EmptyStateInSection.test.svelte";

describe("EmptyState", () => {
  it("renders the title as an h3 with the subtitle and actions", () => {
    render(EmptyState);

    expect(
      screen.getByRole("heading", { level: 3, name: "No projects yet" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Projects hold the files and people for one piece of work.",
      ),
    ).toHaveClass("bx--empty-state__subtitle");
    expect(
      screen.getByRole("button", { name: "Create project" }).parentElement,
    ).toHaveClass("bx--empty-state__actions");
  });

  it("sets the heading level", () => {
    render(EmptyState, { headingLevel: 2 });

    expect(
      screen.getByRole("heading", { level: 2, name: "No projects yet" }),
    ).toBeVisible();
  });

  it("titles itself one level below the Section it sits in", () => {
    render(EmptyStateInSection);

    expect(
      screen.getByRole("heading", { level: 4, name: "Files" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 5, name: "No files yet" }),
    ).toBeVisible();
  });

  it("renders no heading without a title", () => {
    render(EmptyStateComponent, { subtitle: "Nothing here" });

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders the heading for a `titleChildren` slot without a title", () => {
    render(EmptyStateTitleChildren);

    expect(
      screen.getByRole("heading", { level: 3, name: "Custom title" }),
    ).toBeVisible();
  });

  it("renders the `subtitle` prop when there is no subtitle slot", () => {
    render(EmptyState, { withSlots: false });

    expect(
      screen.getByText(
        "Projects hold the files and people for one piece of work.",
      ),
    ).toHaveClass("bx--empty-state__subtitle");
  });

  it("caps the heading level at 6 inside a level 6 Section", () => {
    render(EmptyStateInSection, { level: 6 });

    expect(
      screen.getByRole("heading", { level: 6, name: "No files yet" }),
    ).toBeVisible();
  });

  it("hides the illustration from assistive technology", () => {
    render(EmptyState);

    const illustration = screen
      .getByTestId("empty")
      .querySelector(".bx--empty-state__illustration");
    expect(illustration).toHaveAttribute("aria-hidden", "true");
    expect(illustration?.querySelector("svg")).not.toBeNull();
  });

  it("renders a subtitle slot, such as one with a link", () => {
    render(EmptyState, { linkSubtitle: true });

    expect(screen.getByRole("link", { name: "the docs" })).toBeVisible();
  });

  it("omits the illustration, subtitle and actions when not given", () => {
    render(EmptyState, { withSlots: false, subtitle: "" });

    const root = screen.getByTestId("empty");
    expect(root.querySelector(".bx--empty-state__illustration")).toBeNull();
    expect(root.querySelector(".bx--empty-state__subtitle")).toBeNull();
    expect(root.querySelector(".bx--empty-state__actions")).toBeNull();
  });

  it("applies the small size", () => {
    render(EmptyState, { size: "sm" });

    expect(screen.getByTestId("empty")).toHaveClass("bx--empty-state--sm");
  });
});
