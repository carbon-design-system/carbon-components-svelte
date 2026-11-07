// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import CodeEditor from "./CodeEditor.test.svelte";

// Painting needs the DOM, so the server writes the textarea with its code in
// view, and the layer waits for script.
describe("CodeEditor server render", () => {
  it("renders the labelled textarea with its code, not yet hidden", () => {
    const { document } = renderSSR(CodeEditor, {
      value: "const a = 1;\nlet b;",
      invalid: true,
      invalidText: "Not valid",
      name: "code",
    });

    const field = document.querySelector("textarea");
    expect(field?.textContent).toBe("const a = 1;\nlet b;");
    expect(field?.getAttribute("name")).toBe("code");
    expect(field?.getAttribute("aria-invalid")).toBe("true");
    expect(document.querySelector("label")?.getAttribute("for")).toBe(
      field?.id,
    );
    expect(
      document.querySelector(".bx--code-editor__scroller--ready"),
    ).toBeNull();
    expect(document.querySelector(".bx--code-editor__line")).toBeNull();
    expect(
      document.querySelector(".bx--form-requirement")?.textContent,
    ).toContain("Not valid");
  });
});
