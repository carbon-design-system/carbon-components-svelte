import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DockLayout from "./DockLayout.test.svelte";

const layout = () => JSON.parse(screen.getByTestId("layout").textContent ?? "");
const regionTabs = (name: RegExp) =>
  within(screen.getByRole("region", { name }))
    .getAllByRole("tab")
    .map((tab) => tab.textContent?.replace(/\s+/g, " ").trim());

/** The dock's own live region, not a strip's. */
const dockStatus = () =>
  document.querySelector(".bx--dock > [role='status']") as HTMLElement;

const MOVE_RIGHT = "{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}";
const MOVE_LEFT = "{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}";

describe("DockLayout", () => {
  it("renders each group as a region named by its active tab", () => {
    render(DockLayout);

    expect(
      screen.getByRole("region", { name: "Group 1 of 2, Alpha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Group 2 of 2, Charlie" }),
    ).toBeInTheDocument();
    expect(regionTabs(/Group 1/)).toEqual(["Alpha", "Bravo Modified"]);
    expect(document.querySelector(".bx--splitter__separator")).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
  });

  it("leaves out a tab that has no document", () => {
    render(DockLayout, {
      props: {
        documents: [
          { id: "a", label: "Alpha" },
          { id: "c", label: "Charlie" },
        ],
      },
    });

    expect(regionTabs(/Group 1/)).toEqual(["Alpha"]);
  });

  it("moves a tab to the group beside it, and focus and the status follow", async () => {
    const onChange = vi.fn();
    render(DockLayout, { props: { onChange } });
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_RIGHT);
    await tick();

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "move",
        tabId: "a",
        groupId: "group-2",
        source: "keyboard",
      }),
    );
    expect(layout().children[1].tabs).toEqual(["c", "a"]);
    expect(layout().children[0].tabs).toEqual(["b"]);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
    expect(dockStatus()).toHaveTextContent("Moved Alpha to group 2 of 2");
  });

  it("splits a tab off when no group lies that way, and collapses an emptied group", async () => {
    render(DockLayout);
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_LEFT);
    await tick();
    expect(layout().children.map((c: { tabs: string[] }) => c.tabs)).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ]);

    screen.getByRole("tab", { name: "Charlie" }).focus();
    await user.keyboard("{Delete}");
    await tick();
    expect(layout().children).toHaveLength(2);
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("keeps the layout when a layoutchange handler refuses", async () => {
    const onChange = vi.fn();
    render(DockLayout, { props: { refuse: true, onChange } });
    const before = screen.getByTestId("layout").textContent;
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard(MOVE_RIGHT);
    await tick();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("layout").textContent).toBe(before);
    expect(dockStatus().textContent).toBe("");
  });

  it("cycles the focus through the groups with F6", async () => {
    render(DockLayout);
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await user.keyboard("{F6}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
    await user.keyboard("{F6}");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
    await user.keyboard("{Shift>}{F6}{/Shift}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
  });

  it("marks the maximized group, and ignores a group that does not exist", () => {
    const { unmount } = render(DockLayout, { props: { maximized: "group-2" } });
    expect(screen.getByRole("region", { name: /Group 2/ })).toHaveClass(
      "bx--dock__group--maximized",
    );
    unmount();

    render(DockLayout, { props: { maximized: "nowhere" } });
    expect(
      document.querySelector(".bx--dock__group--maximized"),
    ).not.toBeInTheDocument();
  });
});
