import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import UserAvatarGroupOverflow from "./UserAvatarGroupOverflow.test.svelte";

function chip() {
  const el = document.querySelector<HTMLElement>(
    ".bx--user-avatar-group__overflow",
  );
  assert(el);
  return el;
}

/** The element that takes focus and clicks: the chip or its tooltip trigger. */
function control() {
  const button = chip().closest("button");
  assert(button);
  return button;
}

describe("UserAvatarGroup interactiveOverflow", () => {
  it("leaves a chip without names out of the tab order by default", async () => {
    render(UserAvatarGroupOverflow, { props: { named: false } });
    await tick();

    expect(chip().tagName).toBe("SPAN");
    expect(chip().closest("button")).toBeNull();
  });

  it.each([
    ["with names", true],
    ["without names", false],
  ])("dispatches click:overflow on click and Enter, %s", async (_, named) => {
    const onOverflowClick = vi.fn();
    render(UserAvatarGroupOverflow, {
      props: { interactiveOverflow: true, named, onOverflowClick },
    });
    await tick();

    expect(control()).toHaveAttribute("type", "button");
    await user.click(control());
    expect(onOverflowClick).toHaveBeenCalledOnce();
    const { hidden } = onOverflowClick.mock.calls[0][0].detail;
    expect(hidden.map((item: { name?: string }) => item.name)).toEqual(
      named ? ["Dinesh", "Bertram"] : ["", ""],
    );

    control().focus();
    await user.keyboard("{Enter}");
    expect(onOverflowClick).toHaveBeenCalledTimes(2);
  });

  it("does not dispatch click:overflow without interactiveOverflow", async () => {
    const onOverflowClick = vi.fn();
    render(UserAvatarGroupOverflow, { props: { onOverflowClick } });
    await tick();

    await user.click(control());
    expect(onOverflowClick).not.toHaveBeenCalled();
  });

  it("passes the hidden avatars to the overflow slot", async () => {
    render(UserAvatarGroupOverflow, { props: { withSlot: true } });
    await tick();

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Dinesh", "Bertram"]);
  });
});
