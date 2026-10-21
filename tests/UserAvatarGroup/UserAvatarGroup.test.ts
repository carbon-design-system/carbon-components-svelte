import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import UserAvatarGroup from "./UserAvatarGroup.test.svelte";
import UserAvatarGroupDynamic from "./UserAvatarGroupDynamic.test.svelte";
import UserAvatarGroupTooltips from "./UserAvatarGroupTooltips.test.svelte";

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
  it("opens a neighbor's tooltip instantly and closes the previous one", async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(UserAvatarGroupTooltips);
      await tick();

      const [monica, richard] = Array.from(
        container.querySelectorAll<HTMLElement>(".bx--user-avatar-tooltip"),
      );
      const tooltips = () =>
        screen.queryAllByRole("tooltip").map((el) => el.textContent?.trim());

      await fireEvent.mouseEnter(monica);
      await vi.advanceTimersByTimeAsync(100);
      expect(tooltips()).toEqual(["Monica Hall"]);

      await fireEvent.mouseLeave(monica);
      await fireEvent.mouseEnter(richard);
      await tick();
      expect(tooltips()).toEqual(["Richard Hendricks"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders every avatar and no overflow when under max", async () => {
    render(UserAvatarGroup);
    await tick();

    const root = groupRoot("under-max");
    expect(root.querySelectorAll(".bx--user-avatar")).toHaveLength(3);
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(0);
    expect(root).not.toHaveTextContent("+");
  });

  it("hides avatars past max and renders a +N overflow avatar", async () => {
    render(UserAvatarGroup);
    await tick();

    const root = groupRoot("overflow");
    // Two of the four slotted avatars are hidden as overflow.
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(2);
    // The overflow avatar shows the hidden count.
    expect(root).toHaveTextContent("+2");
    expect(
      root.querySelector(".bx--user-avatar-group__overflow"),
    ).toBeInTheDocument();
  });

  it("treats max of 0 as no limit", async () => {
    render(UserAvatarGroup);
    await tick();

    const root = groupRoot("no-limit");
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(0);
    expect(root).not.toHaveTextContent("+");
  });

  it.each<[string, boolean, (root: HTMLElement) => void]>([
    ["spaced", false, (root) => expect(root).toHaveClass("bx--stack-scale-3")],
    [
      "tighter",
      true,
      (root) =>
        expect(root.style.getPropertyValue("--user-avatar-group-overlap")).toBe(
          "-1rem",
        ),
    ],
  ])(
    "applies the overlap modifier only as needed for the %s gap",
    async (testId, hasOverlap, extra) => {
      render(UserAvatarGroup);
      await tick();

      const root = groupRoot(testId);
      if (hasOverlap) {
        expect(root).toHaveClass("bx--user-avatar-group--overlap");
      } else {
        expect(root).not.toHaveClass("bx--user-avatar-group--overlap");
      }
      extra(root);
    },
  );

  it("uses total for the overflow without rendering the hidden avatars", async () => {
    render(UserAvatarGroup);
    await tick();

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

  it("cascades its size to avatars that do not set their own", async () => {
    render(UserAvatarGroup);
    await tick();

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
    await tick();

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

  it("reverses the stacking order so the first avatar paints on top, even when tooltipText wraps it", async () => {
    render(UserAvatarGroup);
    await tick();

    const root = groupRoot("stack-first");
    expect(root).toHaveClass("bx--user-avatar-group--stack-first");
    expect(root.style.getPropertyValue("--user-avatar-group-count")).toBe("3");

    // Each avatar sets `tooltipText`, so the registered node is nested inside
    // a `TooltipDefinition` wrapper. The stacking index must land on that
    // direct child wrapper (what the CSS `> *` selector targets), not on the
    // nested avatar span the CSS rule never reaches.
    const wrappers = Array.from(root.children).filter(
      (child): child is HTMLElement =>
        child.classList.contains("bx--user-avatar-tooltip"),
    );
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
    await tick();

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

  it("tracks an avatar whose root element is replaced", async () => {
    render(UserAvatarGroup);
    await tick();

    const root = groupRoot("root-swap");
    await user.click(screen.getByTestId("toggle-tooltip"));
    await user.click(screen.getByTestId("toggle-swap-lead"));

    // Alice leads, so Cara and Dan overflow. A stale node for Cara would
    // misplace her in the registry and hide the wrong avatars.
    await waitFor(() => {
      expect(root).toHaveTextContent("+2");
    });
    const hidden = Array.from(
      root.querySelectorAll('[data-overflow="true"]'),
    ).map((el) => el.textContent?.trim());
    expect(hidden).toEqual(["C3", "D4"]);
  });

  it("shrinks the overflow when an avatar is removed", async () => {
    const { container, rerender } = render(UserAvatarGroupDynamic, {
      props: { names: ["Ann", "Bob", "Cy"], max: 2 },
    });
    await tick();
    const root = container.querySelector<HTMLElement>(".bx--user-avatar-group");
    assert(root);
    expect(root).toHaveTextContent("+1");

    await rerender({ names: ["Ann", "Bob"] });
    await tick();

    expect(root).not.toHaveTextContent("+");
    expect(root.querySelectorAll('[data-overflow="true"]')).toHaveLength(0);
  });

  it("updates the overflow tooltip when a hidden avatar is renamed", async () => {
    const { container, rerender } = render(UserAvatarGroupDynamic, {
      props: { names: ["Ann", "Bob"], max: 1 },
    });
    await tick();
    await rerender({ names: ["Ann", "Zed"] });
    await tick();

    const overflow = container.querySelector(
      ".bx--user-avatar-group__overflow",
    );
    assert(overflow);
    await user.hover(overflow);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent("Zed");
    });
  });

  it("removes the stacking index when stackOrder returns to last", async () => {
    const { container, rerender } = render(UserAvatarGroupDynamic, {
      props: { names: ["Ann", "Bob"], stackOrder: "first" },
    });
    await tick();
    const indexes = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(".bx--user-avatar"),
      ).map((avatar) => avatar.style.getPropertyValue("--user-avatar-index"));
    expect(indexes()).toEqual(["0", "1"]);

    await rerender({ stackOrder: "last" });
    await tick();

    expect(indexes()).toEqual(["", ""]);
  });

  it("merges a consumer style with the computed group style", async () => {
    const { container } = render(UserAvatarGroupDynamic, {
      props: { names: ["Ann", "Bob"], gap: "-1rem", style: "color: red" },
    });
    await tick();

    const root = container.querySelector<HTMLElement>(".bx--user-avatar-group");
    assert(root);
    expect(root.style.color).toBe("red");
    expect(root.style.getPropertyValue("--user-avatar-group-overlap")).toBe(
      "-1rem",
    );
  });
});
