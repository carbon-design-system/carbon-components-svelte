import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderPanelExclusive from "./HeaderPanelExclusive.test.svelte";

const trigger = (name: string) => screen.getByRole("button", { name });

describe("Header panels", () => {
  it.each([
    ["Help", "Acme Corp"],
    ["Acme Corp", "Profile"],
    ["Profile", "Notifications"],
  ])(
    "opening %s then %s leaves only the second open",
    async (first, second) => {
      render(HeaderPanelExclusive);

      await user.click(trigger(first));
      expect(trigger(first)).toHaveAttribute("aria-expanded", "true");

      await user.click(trigger(second));
      expect(trigger(second)).toHaveAttribute("aria-expanded", "true");
      expect(trigger(first)).toHaveAttribute("aria-expanded", "false");
    },
  );
});
