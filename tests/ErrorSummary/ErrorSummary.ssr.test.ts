// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ErrorSummary from "./ErrorSummary.test.svelte";

describe("ErrorSummary server render", () => {
  it("renders server-side validation errors as links to the fields", () => {
    const { document } = renderSSR(ErrorSummary, {
      invalid: true,
      errors: [
        { fieldId: "name", message: "Enter a name" },
        { fieldId: "plan-a", message: "Choose a plan" },
      ],
    });

    const summary = document.querySelector(".bx--error-summary");
    expect(summary).toHaveAttribute("role", "group");
    expect(summary).toHaveAttribute("tabindex", "-1");
    expect(
      document.getElementById(summary?.getAttribute("aria-labelledby") ?? ""),
    ).toHaveTextContent("There is a problem");

    // With no script, the hash link jumps to the field.
    const hrefs = [
      ...document.querySelectorAll(".bx--error-summary__link"),
    ].map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["#name", "#plan-a"]);
    for (const href of hrefs) {
      expect(document.getElementById(href?.slice(1) ?? "")).not.toBeNull();
    }
  });

  it("renders nothing without errors", () => {
    const { document } = renderSSR(ErrorSummary, { errors: [] });

    expect(document.querySelector(".bx--error-summary")).toBeNull();
  });
});
