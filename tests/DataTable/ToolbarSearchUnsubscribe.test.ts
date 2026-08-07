import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchUnsubscribe from "./ToolbarSearchUnsubscribe.test.svelte";

// Regression test: toggling `shouldFilterRows` used to overwrite the
// component's `unsubscribe` handle without calling the previous one first,
// leaking a live `tableRows` subscriber on every `false -> true` toggle.
// Each leaked subscriber re-runs the row-equality check on every emission,
// so the leak compounds with every toggle over a component's lifetime.
describe("ToolbarSearch unsubscribes from tableRows before resubscribing", () => {
  it("keeps exactly one live subscriber after toggling shouldFilterRows repeatedly", async () => {
    const { component } = render(ToolbarSearchUnsubscribe);

    const toggleButton = screen.getByRole("button", { name: "Toggle filter" });

    // Mounts with `shouldFilterRows = true` (one live subscription), then
    // toggles true -> false -> true -> false -> true.
    for (let i = 0; i < 4; i++) {
      await user.click(toggleButton);
    }

    // Baseline includes the immediate callback fire every new subscription
    // receives from the store; reset the reference point before the single
    // emission we actually care about.
    const baseline = component.subscribeCount;

    await user.click(screen.getByRole("button", { name: "Change rows" }));

    // Exactly one live subscriber should receive the emission. Before the
    // fix, each `false -> true` toggle leaked the previous subscription, so
    // this would be 3 (three live subscribers left over from the toggles).
    expect(component.subscribeCount - baseline).toBe(1);
  });
});
