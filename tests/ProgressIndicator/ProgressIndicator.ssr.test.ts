// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ProgressIndicator from "./ProgressIndicator.test.svelte";
import ProgressIndicatorSelectedId from "./ProgressIndicatorSelectedId.test.svelte";

// Steps register through a batched store update that a server render
// finishes before, so no step was current (no `--current`, no
// `aria-current`) until hydration.
const steps = ["Account", "Billing", "Region", "Review"].map((label) => ({
  label,
  description: label,
  complete: false,
}));

describe("ProgressIndicator server render", () => {
  const current = (document: Document) =>
    [...document.querySelectorAll(".bx--progress-step")].map(
      (step) =>
        step.classList.contains("bx--progress-step--current") &&
        step.querySelector("[aria-current='step']") !== null,
    );

  it("marks the step at currentIndex current", () => {
    const { document } = renderSSR(ProgressIndicator, {
      currentIndex: 1,
      steps,
    });
    expect(current(document)).toEqual([false, true, false, false]);
  });

  it("marks the step with selectedId current", () => {
    const { document } = renderSSR(ProgressIndicatorSelectedId, {
      selectedId: "step-c",
    });
    expect(current(document)).toEqual([false, false, true]);
  });
});
