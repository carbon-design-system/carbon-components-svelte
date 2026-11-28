import { render, screen } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import { user } from "../utils/user";
import CodeSnippetPreview from "./CodeSnippetPreview.test.svelte";
import { mockClipboard } from "./helpers";

describe("CodeSnippet preview", () => {
  it("renders the example in a named group before the code", async () => {
    const writeText = mockClipboard();
    const { container } = render(CodeSnippetPreview);
    const preview = screen.getByRole("group", { name: "Preview" });
    expect(preview).toContainElement(
      screen.getByRole("button", { name: "Save" }),
    );
    const textbox = screen.getByRole("textbox");
    expect(
      preview.compareDocumentPosition(textbox) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector(".bx--snippet")).toHaveClass(
      "bx--snippet--has-preview",
    );
    expect(container.querySelector(".bx--snippet__preview-bar")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(writeText).toHaveBeenCalledWith("<Button>Save</Button>");
  });

  it("shows a bar of actions named by its label", async () => {
    const onPlay = vi.fn();
    render(CodeSnippetPreview, {
      props: { actions: true, previewLabelText: "Example", onPlay },
    });
    const preview = screen.getByRole("group", { name: "Example" });
    expect(preview).not.toHaveAttribute("aria-label");
    expect(screen.getByText("Example")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it.each(["single", "inline"] as const)(
    "renders no preview for %s",
    (type) => {
      const { container } = render(CodeSnippetPreview, {
        props: { type, actions: true },
      });
      expect(screen.queryByRole("group")).toBeNull();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
      expect(container.querySelector(".bx--snippet--has-preview")).toBeNull();
    },
  );

  it("makes the example inert while disabled", () => {
    render(CodeSnippetPreview, { props: { actions: true, disabled: true } });
    const preview = screen.getByRole("group", { name: "Preview" });
    // jsdom has no `inert` property: Svelte 5 sets it as one, while Svelte
    // 3 and 4 set the attribute.
    expect(
      preview.hasAttribute("inert") ||
        (preview as HTMLElement & { inert?: boolean }).inert === true,
    ).toBe(true);
  });

  it("adds nothing without the slot", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code: "npm i" },
    });
    expect(container.querySelector(".bx--snippet__preview")).toBeNull();
    expect(container.querySelector(".bx--snippet--has-preview")).toBeNull();
  });
});
