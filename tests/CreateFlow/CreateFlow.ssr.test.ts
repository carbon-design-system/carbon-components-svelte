// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import CreateFlow from "./CreateFlow.test.svelte";

describe("CreateFlow (server)", () => {
  it("renders the rail and the first step only, named and numbered", () => {
    const { document } = renderSSR(CreateFlow);

    const current = document.querySelector(".bx--progress-step--current");
    expect(current?.textContent).toContain("Details");
    expect(document.querySelectorAll(".bx--progress-step")).toHaveLength(4);
    expect(
      document.querySelector("[data-create-flow-heading]")?.textContent,
    ).toBe("Step 1 of 4: Details");
    // Later steps are built on their first visit.
    expect(document.querySelectorAll("[data-create-flow-step]")).toHaveLength(
      1,
    );
    expect(document.body.textContent).not.toContain("Subnet");
  });

  it("ties the Next button to the form", () => {
    const { document } = renderSSR(CreateFlow);

    const form = document.querySelector("form");
    const button = document.querySelector("button[type=submit]");
    expect(form?.id).toBeTruthy();
    expect(button?.getAttribute("form")).toBe(form?.id);
  });
});
