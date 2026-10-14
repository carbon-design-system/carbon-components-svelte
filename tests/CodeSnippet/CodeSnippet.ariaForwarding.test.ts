import { render, screen } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

describe("CodeSnippet aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  describe.each(["single", "multi"] as const)("type: %s", (type) => {
    it("places a consumer aria-describedby on the code container", () => {
      const { container } = render(CodeSnippet, {
        props: { type, code: "npm i", "aria-describedby": "extra-help" },
      });

      const textbox = screen.getByRole("textbox", { name: "Code snippet" });
      expect(textbox).toHaveAttribute("aria-describedby", "extra-help");
      expect(textbox).toHaveAccessibleDescription("Extra help");
      expect(container.querySelector(".bx--snippet")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("names the code container with a consumer aria-labelledby", () => {
      const { container } = render(CodeSnippet, {
        props: { type, code: "npm i", "aria-labelledby": "external-name" },
      });

      expect(
        screen.getByRole("textbox", { name: "External name" }),
      ).toBeInTheDocument();
      expect(container.querySelector(".bx--snippet")).not.toHaveAttribute(
        "aria-labelledby",
      );
    });

    it("names the code container with a consumer aria-label", () => {
      const { container } = render(CodeSnippet, {
        props: { type, code: "npm i", "aria-label": "Install command" },
      });

      expect(
        screen.getByRole("textbox", { name: "Install command" }),
      ).toBeInTheDocument();
      expect(container.querySelector(".bx--snippet")).not.toHaveAttribute(
        "aria-label",
      );
    });
  });
});
