import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TabsModified from "./TabsModified.test.svelte";
import TabsVerticalModified from "./TabsVerticalModified.test.svelte";

describe("Tab modified", () => {
  it("adds the text to the name of a modified tab and no other", () => {
    render(TabsModified);

    expect(screen.getByRole("tab", { name: "Bravo Modified" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Alpha" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Charlie" })).toBeVisible();
  });

  it("draws an aria-hidden dot in the dismiss button's place, on that tab only", () => {
    const { container } = render(TabsModified);

    const dots = container.querySelectorAll(
      ".bx--tabs__nav-item--modified-dot",
    );
    expect(dots).toHaveLength(1);
    expect(dots[0]).toHaveAttribute("aria-hidden", "true");
    expect(dots[0].closest(".bx--tabs__nav-item--close")).not.toBeNull();
    expect(dots[0].closest("li")).toHaveClass("bx--tabs__nav-item--modified");
    // The button is still there to press, and still named.
    expect(
      screen.getByRole("button", { name: "Dismiss Bravo" }),
    ).toBeInTheDocument();
  });

  it("uses `modifiedText` for the name", () => {
    render(TabsModified, { props: { modifiedText: "Unsaved" } });

    expect(screen.getByRole("tab", { name: "Bravo Unsaved" })).toBeVisible();
  });

  it("puts the text in the label of an icon-only tab", () => {
    render(TabsModified, { props: { iconOnly: true } });

    expect(screen.getByRole("tab", { name: "Bravo Modified" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Alpha" })).toBeVisible();
  });

  it("draws the dot of a tab with no dismiss button inside the tab", () => {
    const { container } = render(TabsModified, {
      props: { dismissible: false },
    });

    const dot = container.querySelector(".bx--tabs__nav-item--modified-dot");
    expect(dot).toHaveClass("bx--tabs__nav-item--modified-dot--static");
    expect(dot?.closest("li")).toHaveClass(
      "bx--tabs__nav-item--modified-static",
    );
    expect(screen.getByRole("tab", { name: "Bravo Modified" })).toBeVisible();
  });

  it("dismisses with a middle click, and only a middle click", async () => {
    const onDismiss = vi.fn();
    render(TabsModified, { props: { onDismiss } });
    const bravo = screen.getByRole("tab", { name: "Bravo Modified" });

    await fireEvent(
      bravo,
      new MouseEvent("auxclick", { button: 2, bubbles: true }),
    );
    expect(onDismiss).not.toHaveBeenCalled();

    await fireEvent(
      bravo,
      new MouseEvent("auxclick", {
        button: 1,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b" }),
    );
  });

  it("does not take a middle click without `dismissible`", async () => {
    const onDismiss = vi.fn();
    render(TabsModified, { props: { onDismiss, dismissible: false } });

    await fireEvent(
      screen.getByRole("tab", { name: "Bravo Modified" }),
      new MouseEvent("auxclick", { button: 1, bubbles: true }),
    );

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("keeps the tab, and focus on it, when the handler cancels", async () => {
    render(TabsModified, { props: { refuse: true } });
    const bravo = screen.getByRole("tab", { name: "Bravo Modified" });
    bravo.focus();

    await user.keyboard("{Delete}");
    await tick();
    await tick();

    expect(bravo).toBeInTheDocument();
    expect(bravo).toHaveFocus();
  });

  it("still moves focus on to the next tab when the handler removes it", async () => {
    render(TabsModified);
    screen.getByRole("tab", { name: "Bravo Modified" }).focus();

    await user.keyboard("{Delete}");
    await tick();
    await tick();

    expect(
      screen.queryByRole("tab", { name: /Bravo/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
  });
});

describe("Tab modified in TabsVertical", () => {
  it("is ignored: vertical tabs draw no dot", () => {
    const { container } = render(TabsVerticalModified);

    expect(
      container.querySelector(".bx--tabs__nav-item--modified-dot"),
    ).toBeNull();
    expect(screen.getByRole("tab", { name: "One" })).toBeVisible();
  });
});
