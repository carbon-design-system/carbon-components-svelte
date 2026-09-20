import { render, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchUnsubscribe from "./ToolbarSearchUnsubscribe.test.svelte";

// Regression test: toggling `shouldFilterRows` used to overwrite the
// component's `unsubscribe` handle without calling the previous one first,
// leaking a live `tableRows` subscriber on every `false -> true` toggle.
// Each leaked subscriber re-runs the row-equality check on every emission,
// so the leak compounds with every toggle over a component's lifetime.
describe("ToolbarSearch unsubscribes from tableRows before resubscribing", () => {
  it("keeps exactly one live subscriber after toggling shouldFilterRows repeatedly", async () => {
    // "Change rows" produces a genuinely different `rows` value, which the
    // active `ToolbarSearch` independently replays through `filterRows`, so
    // even a single live subscriber sees more than one emission from it.
    // Comparing a toggled instance against a freshly mounted control (never
    // toggled, so it can only ever have exactly one live subscriber) isolates
    // the thing this test actually guards -- extra emissions from LEAKED
    // subscribers -- from that unrelated, expected replay fan-out.
    const control = render(ToolbarSearchUnsubscribe);
    const controlBaseline = control.component.subscribeCount;
    await user.click(
      within(control.container).getByRole("button", { name: "Change rows" }),
    );
    const controlDelta = control.component.subscribeCount - controlBaseline;

    const { component, container } = render(ToolbarSearchUnsubscribe);
    const toggleButton = within(container).getByRole("button", {
      name: "Toggle filter",
    });

    // Mounts with `shouldFilterRows = true` (one live subscription), then
    // toggles true -> false -> true -> false -> true.
    for (let i = 0; i < 4; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential execution is intentional
      await user.click(toggleButton);
    }

    const baseline = component.subscribeCount;

    await user.click(
      within(container).getByRole("button", { name: "Change rows" }),
    );

    // Before the fix, each `false -> true` toggle leaked the previous
    // subscription, so a toggled instance would see more emissions than the
    // control instead of matching it exactly.
    expect(component.subscribeCount - baseline).toBe(controlDelta);
  });
});
