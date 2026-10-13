import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderPanelGroup from "./HeaderPanelGroup.test.svelte";

const trigger = () => screen.getByRole("button", { name: "Switcher" });

const openPanel = async () => {
  await user.click(trigger());
};

const outerList = () =>
  document.querySelector(
    ".bx--header-panel ul.bx--switcher__item",
  ) as HTMLElement;

describe("HeaderPanelGroup", () => {
  it("renders one outer list item per group", async () => {
    render(HeaderPanelGroup);
    await openPanel();

    const items = Array.from(outerList().children);
    expect(items).toHaveLength(4);
    expect(items.every((item) => item.tagName === "LI")).toBe(true);
  });

  it("exposes each group as a named list of exactly its links", async () => {
    render(HeaderPanelGroup);
    await openPanel();

    const resources = screen.getByRole("list", { name: "Resources" });
    expect(
      within(resources)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Documentation", "Status page"]);

    const community = screen.getByRole("list", { name: "Community" });
    expect(within(community).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(community).getByRole("button", { name: "Discord" }),
    ).toBeInTheDocument();
  });

  it("hides the visible label and rule from the accessibility tree", async () => {
    render(HeaderPanelGroup);
    await openPanel();

    const label = document.querySelector(".bx--header-panel-divider");
    expect(label).toHaveAttribute("aria-hidden", "true");
    expect(label).toHaveTextContent("Resources");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("names the list from the label slot", async () => {
    render(HeaderPanelGroup);
    await openPanel();

    const list = screen.getByRole("list", { name: "Custom label" });
    expect(within(list).getByRole("link", { name: "Slotted" })).toBeVisible();
  });

  it("omits the label and list name when there is no label", async () => {
    render(HeaderPanelGroup);
    await openPanel();

    const link = screen.getByRole("link", { name: "Unlabelled" });
    const list = link.closest("ul") as HTMLElement;
    expect(list).not.toHaveAttribute("aria-labelledby");
    expect(list.closest("li")?.querySelector(".bx--header-panel-divider")).toBe(
      null,
    );
  });

  it("moves focus across groups with the arrow, Home and End keys", async () => {
    render(HeaderPanelGroup);
    await openPanel();

    const link = (name: string) =>
      screen.getByRole(name === "Discord" ? "button" : "link", { name });

    link("Status page").focus();
    await user.keyboard("{ArrowDown}");
    expect(link("GitHub")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(link("Status page")).toHaveFocus();
    await user.keyboard("{End}");
    expect(link("Unlabelled")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(link("Documentation")).toHaveFocus();
    await user.keyboard("{End}");
    expect(link("Unlabelled")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(link("Documentation")).toHaveFocus();
  });

  it("closes the panel when a link inside a group is activated", async () => {
    const onClose = vi.fn();
    render(HeaderPanelGroup, { props: { onClose } });
    await openPanel();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("link", { name: "GitHub" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });
});
