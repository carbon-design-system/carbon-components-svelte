// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import FormulaInput from "./FormulaInput.ssr.test.svelte";

describe("FormulaInput on the server", () => {
  it("sends a labelled textarea with its text, and the layer hidden until script runs", () => {
    const { document } = renderSSR(FormulaInput);
    const field = document.querySelector("textarea");

    expect(field?.value).toBe("ROUND(price, 2) + FOO(1)");
    expect(field?.getAttribute("dir")).toBe("ltr");
    expect(document.querySelector("label")?.textContent).toContain("Formula");
    expect(
      document
        .querySelector(".bx--formula-input__layer")
        ?.hasAttribute("hidden"),
    ).toBe(true);
    expect(
      document.querySelector(".bx--formula-input__scroller--ready"),
    ).toBeNull();
    expect(document.querySelector("[role=listbox]")).toBeNull();
  });

  it("sends the error and the invalid state in the markup", () => {
    const { document } = renderSSR(FormulaInput);
    const field = document.querySelector("textarea");
    const message = document.getElementById(
      field?.getAttribute("aria-errormessage") ?? "",
    );

    expect(field?.getAttribute("aria-invalid")).toBe("true");
    expect(message?.textContent).toContain('Unknown function "FOO"');
  });
});
