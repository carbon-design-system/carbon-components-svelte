import { render } from "@testing-library/svelte";
import CodeSnippet from "../../src/CodeSnippet/CodeSnippet.svelte";

describe("CodeSnippet fullWidth", () => {
  it.each(["single", "multi"] as const)(
    "lifts the width cap of a %s snippet",
    (type) => {
      const { container } = render(CodeSnippet, {
        type,
        code: "npm i carbon-components-svelte",
        fullWidth: true,
      });

      expect(container.querySelector(".bx--snippet")).toHaveClass(
        "bx--snippet--full-width",
      );
    },
  );

  it("keeps the cap by default", () => {
    const { container } = render(CodeSnippet, { type: "multi", code: "a" });

    expect(container.querySelector(".bx--snippet")).not.toHaveClass(
      "bx--snippet--full-width",
    );
  });
});
