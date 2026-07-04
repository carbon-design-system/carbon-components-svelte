import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import UserAvatarGroup from "./UserAvatarGroup.test.svelte";

function groupRoot(testId: string): HTMLElement {
  const root = screen
    .getByTestId(testId)
    .querySelector<HTMLElement>(".bx--user-avatar-group");
  assert(root);
  return root;
}

// The single visible (non-overflow, non-chip) avatar in a `max={1}` group.
function visibleAvatar(root: HTMLElement): HTMLElement {
  const avatar = root.querySelector<HTMLElement>(
    '.bx--user-avatar:not([data-overflow="true"]):not(.bx--user-avatar-group__overflow)',
  );
  assert(avatar);
  return avatar;
}

describe("UserAvatarGroup", () => {
  it("renders every avatar and no overflow when under max", () => {
    render(UserAvatarGroup);

    const root = groupRoot("under-max");
    expect(root.querySelectorAll(".bx--user-avatar")).toHaveLength(3);
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(0);
    expect(root).not.toHaveTextContent("+");
  });

  it("applies the overlap modifier by default", () => {
    render(UserAvatarGroup);

    expect(groupRoot("under-max")).toHaveClass(
      "bx--user-avatar-group--overlap",
    );
  });

  it("hides avatars past max and renders a +N overflow avatar", () => {
    render(UserAvatarGroup);

    const root = groupRoot("overflow");
    // Two of the four slotted avatars are hidden as overflow.
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(2);
    // The overflow avatar shows the hidden count.
    expect(root).toHaveTextContent("+2");
    expect(
      root.querySelector(".bx--user-avatar-group__overflow"),
    ).toBeInTheDocument();
  });

  it("treats max of 0 as no limit", () => {
    render(UserAvatarGroup);

    const root = groupRoot("no-limit");
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(0);
    expect(root).not.toHaveTextContent("+");
  });

  it("spaces avatars apart when a gap is set", () => {
    render(UserAvatarGroup);

    const root = groupRoot("spaced");
    expect(root).not.toHaveClass("bx--user-avatar-group--overlap");
    expect(root).toHaveClass("bx--stack-scale-3");
  });

  it("tightens the overlap with a negative gap", () => {
    render(UserAvatarGroup);

    const root = groupRoot("tighter");
    expect(root).toHaveClass("bx--user-avatar-group--overlap");
    expect(root.style.getPropertyValue("--user-avatar-group-overlap")).toBe(
      "-1rem",
    );
  });

  it("uses total for the overflow without rendering the hidden avatars", () => {
    render(UserAvatarGroup);

    const root = groupRoot("total");
    // Only the three slotted avatars render (plus the overflow avatar); the
    // other 247 are never created.
    expect(root.querySelectorAll(".bx--user-avatar")).toHaveLength(4);
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(0);
    // 250 total - 3 shown = 247, capped at 99+.
    expect(
      root.querySelector(".bx--user-avatar-group__overflow"),
    ).toHaveTextContent("99+");
  });

  it("cascades its size to avatars that do not set their own", () => {
    render(UserAvatarGroup);

    const root = groupRoot("cascade");
    // First avatar inherits the group size; the second keeps its own.
    expect(visibleAvatar(root)).toHaveClass("bx--user-avatar--lg");
    expect(root.querySelector('[data-overflow="true"]')).toHaveClass(
      "bx--user-avatar--sm",
    );
    // The overflow avatar is sized by the group too.
    expect(root.querySelector(".bx--user-avatar-group__overflow")).toHaveClass(
      "bx--user-avatar--lg",
    );
  });

  it("uses overflowTooltipText for the overflow chip tooltip", async () => {
    render(UserAvatarGroup);

    const overflow = groupRoot("overflow-tooltip").querySelector(
      ".bx--user-avatar-group__overflow",
    );
    assert(overflow);

    await user.hover(overflow);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Gilfoyle, Jared, and 8 others",
      );
    });
  });

  it("reverses the stacking order so the first avatar paints on top, even when tooltipText wraps it", () => {
    render(UserAvatarGroup);

    const root = groupRoot("stack-first");
    expect(root).toHaveClass("bx--user-avatar-group--stack-first");
    expect(root.style.getPropertyValue("--user-avatar-group-count")).toBe("3");

    // Each avatar sets `tooltipText`, so the registered node is nested inside
    // a `TooltipDefinition` wrapper. The stacking index must land on that
    // direct child wrapper (what the CSS `> *` selector targets), not on the
    // nested avatar span the CSS rule never reaches.
    const wrappers = Array.from(root.children).filter((child) =>
      child.classList.contains("bx--user-avatar-tooltip"),
    ) as HTMLElement[];
    expect(wrappers[0].style.getPropertyValue("--user-avatar-index")).toBe("0");
    expect(
      wrappers[0]
        .querySelector<HTMLElement>(".bx--user-avatar")
        ?.style.getPropertyValue("--user-avatar-index"),
    ).toBe("");
    expect(wrappers[2].style.getPropertyValue("--user-avatar-index")).toBe("2");

    // The overflow chip (past `max={2}`) opts out of registration, so it
    // never gets an index; it relies on the marker-class CSS rule instead.
    const overflowWrapper = root
      .querySelector(".bx--user-avatar-group__overflow")
      ?.closest<HTMLElement>(".bx--user-avatar-tooltip");
    expect(overflowWrapper?.style.getPropertyValue("--user-avatar-index")).toBe(
      "",
    );
  });

  it("re-sorts to DOM order when an avatar is inserted ahead of others", async () => {
    render(UserAvatarGroup);

    const root = groupRoot("resync");
    // Only Bob and Cara are mounted; Bob is the single visible avatar.
    expect(visibleAvatar(root)).toHaveTextContent("B2");
    expect(root).toHaveTextContent("+1");

    // Insert Alice ahead of Bob. She mounts last but renders first, so the
    // group must re-sort to keep her visible instead of Bob.
    await user.click(screen.getByTestId("toggle-lead"));

    await waitFor(() => {
      expect(visibleAvatar(root)).toHaveTextContent("A1");
    });
    expect(root).toHaveTextContent("+2");
  });
});
