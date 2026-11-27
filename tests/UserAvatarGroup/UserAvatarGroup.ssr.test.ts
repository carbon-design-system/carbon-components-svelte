// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import UserAvatarGroupOverflow from "./UserAvatarGroupOverflow.test.svelte";
import UserAvatarGroupSsr from "./UserAvatarGroupSsr.test.svelte";

describe("UserAvatarGroup server render", () => {
  const render = (props: Record<string, unknown> = {}) => {
    const { document } = renderSSR(UserAvatarGroupSsr, props);
    return {
      hidden: [...document.querySelectorAll("[data-overflow]")].length,
      overflow: document.querySelector(".bx--user-avatar-group__overflow")
        ?.textContent,
    };
  };

  it("hides the avatars past max and shows the overflow avatar", () => {
    expect(render()).toEqual({ hidden: 2, overflow: "+2" });
  });

  it("counts total past the slotted avatars", () => {
    expect(render({ total: 10 })).toEqual({ hidden: 2, overflow: "+8" });
  });

  it("shows every avatar without a limit", () => {
    expect(render({ max: 0 })).toEqual({ hidden: 0, overflow: undefined });
  });

  it.each([
    [false, "SPAN"],
    [true, "BUTTON"],
  ])(
    "renders a chip without names with interactiveOverflow %s as a %s",
    (interactiveOverflow, tag) => {
      const { document } = renderSSR(UserAvatarGroupOverflow, {
        interactiveOverflow,
        named: false,
      });
      expect(
        document.querySelector(".bx--user-avatar-group__overflow")?.tagName,
      ).toBe(tag);
    },
  );
});
