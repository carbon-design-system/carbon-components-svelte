// @vitest-environment node
import Stepper from "carbon-components-svelte/Stepper/Stepper.svelte";
import { RANDOM_ID, renderRaw } from "../utils/ssr";

describe("Stepper server render", () => {
  it("derives step ids from `id`", () => {
    const html = renderRaw(Stepper, {
      id: "wizard",
      steps: ["Cart", "Payment"],
    });

    expect(html.match(RANDOM_ID)).toBeNull();
    expect(html).toContain('id="wizard-step-0"');
    expect(html).toContain('id="wizard-step-1"');
  });
});
