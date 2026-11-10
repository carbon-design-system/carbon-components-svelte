import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MarkdownEditor from "./MarkdownEditor.test.svelte";

const bound = () => screen.getByTestId("bound").textContent;

function textarea() {
  const field = screen.getByLabelText("Notes");
  assert(field instanceof HTMLTextAreaElement);
  return field;
}

/** Select `start` to `end` in the textarea without moving focus off it. */
function select(start: number, end = start) {
  const field = textarea();
  field.focus();
  field.setSelectionRange(start, end);
}

describe("MarkdownEditor", () => {
  describe("views", () => {
    it("shows the Write tab first, with a labelled textarea", () => {
      render(MarkdownEditor, { props: { value: "# Hi" } });

      expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(textarea()).toBeVisible();
      expect(screen.getByRole("tabpanel", { name: "Write" })).toBeVisible();
    });

    it("draws the preview on the Preview tab and keeps the textarea in the form", async () => {
      render(MarkdownEditor, {
        props: { value: "# Hi\n\n**bold** and *em*", name: "body" },
      });

      await user.click(screen.getByRole("tab", { name: "Preview" }));

      const panel = screen.getByRole("tabpanel", { name: "Preview" });
      expect(panel.querySelector("h2")).toHaveTextContent("Hi");
      expect(panel.querySelector("strong")).toHaveTextContent("bold");
      expect(panel.querySelector("em")).toHaveTextContent("em");
      expect(screen.getByTestId("view")).toHaveTextContent("preview");
      // The textarea stays, hidden, so the form still submits it.
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(new FormData(form).get("body")).toBe("# Hi\n\n**bold** and *em*");
    });

    it("moves between tabs with the arrow keys", async () => {
      render(MarkdownEditor);

      screen.getByRole("tab", { name: "Write" }).focus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
      expect(screen.getByTestId("view")).toHaveTextContent("preview");
    });

    it("says there is nothing to preview for an empty document", () => {
      render(MarkdownEditor, { props: { view: "preview" } });

      expect(screen.getByText("Nothing to preview")).toBeVisible();
    });
  });

  describe("preview safety", () => {
    it("keeps javascript: links, raw HTML and images inert", () => {
      const { container } = render(MarkdownEditor, {
        props: {
          view: "preview",
          value: [
            "[x](javascript:alert(1)) [y](JaVa\tScRiPt:alert(2)) [z](data:text/html,hi)",
            "",
            '<img src=x onerror="alert(3)"><script>alert(4)</script>',
            "",
            "![pic](https://example.com/a.png)",
            "",
            "[ok](https://example.com)",
          ].join("\n"),
        },
      });

      const panel = screen.getByRole("tabpanel", { name: "Preview" });
      expect(panel.querySelectorAll("script, img, iframe")).toHaveLength(0);
      const hrefs = [...panel.querySelectorAll("a")].map((a) =>
        a.getAttribute("href"),
      );
      expect(hrefs).toEqual([
        "https://example.com/a.png",
        "https://example.com/",
      ]);
      for (const link of panel.querySelectorAll("a")) {
        expect(link.getAttribute("rel")).toContain("noopener");
      }
      expect(container.querySelector("[onerror]")).toBeNull();
      // The raw HTML is shown as text.
      expect(panel).toHaveTextContent("<script>alert(4)</script>");
    });
  });

  describe("toolbar", () => {
    it("is a labelled toolbar with one tab stop", () => {
      render(MarkdownEditor);

      const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
      const buttons = toolbar.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(5);
      expect(
        [...buttons].filter((button) => button.tabIndex === 0),
      ).toHaveLength(1);
    });

    it("moves between buttons with the arrow keys", async () => {
      render(MarkdownEditor);

      const bold = screen.getByRole("button", { name: "Bold" });
      bold.focus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
    });

    it("wraps the selection and leaves it selected", async () => {
      render(MarkdownEditor, { props: { value: "make this bold" } });
      select(5, 9);

      await user.click(screen.getByRole("button", { name: "Bold" }));

      expect(bound()).toBe("make **this** bold");
      expect(textarea().selectionStart).toBe(7);
      expect(textarea().selectionEnd).toBe(11);
    });

    it("takes the markers off again", async () => {
      render(MarkdownEditor, { props: { value: "**this**" } });
      select(2, 6);

      await user.click(screen.getByRole("button", { name: "Bold" }));

      expect(bound()).toBe("this");
    });

    it("prefixes every selected line for a list", async () => {
      render(MarkdownEditor, { props: { value: "a\nb" } });
      select(0, 3);

      await user.click(screen.getByRole("button", { name: "Numbered list" }));

      expect(bound()).toBe("1. a\n2. b");
    });

    it("is left out of a read-only editor and disables for a disabled one", () => {
      const { unmount } = render(MarkdownEditor, { props: { readonly: true } });
      expect(screen.queryByRole("toolbar")).toBeNull();
      unmount();

      render(MarkdownEditor, { props: { disabled: true } });
      expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled();
      expect(screen.getByRole("tab", { name: "Write" })).toBeDisabled();
    });
  });

  describe("shortcuts", () => {
    it("Mod+B, Mod+I and Mod+K edit the selection while the textarea has focus", async () => {
      render(MarkdownEditor, { props: { value: "word" } });
      select(0, 4);

      await user.keyboard("{Control>}b{/Control}");
      expect(bound()).toBe("**word**");

      await user.keyboard("{Control>}z{/Control}");
      select(0, 4);
      await user.keyboard("{Control>}k{/Control}");
      expect(bound()).toContain("[");
      expect(bound()).toContain("](url)");
    });

    it("works with the toolbar left out", async () => {
      render(MarkdownEditor, { props: { value: "word", toolbar: [] } });
      select(0, 4);

      await user.keyboard("{Control>}b{/Control}");

      expect(screen.queryByRole("toolbar")).toBeNull();
      expect(bound()).toBe("**word**");
    });

    it("does nothing from outside the textarea", async () => {
      render(MarkdownEditor, { props: { value: "word" } });

      await user.keyboard("{Control>}b{/Control}");

      expect(bound()).toBe("word");
    });

    it("lists its shortcuts on the buttons", () => {
      render(MarkdownEditor);

      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
        "aria-keyshortcuts",
        expect.stringMatching(/^(Control|Meta)\+B$/),
      );
    });
  });

  describe("lists", () => {
    it("Enter continues a list and an empty item ends it", async () => {
      render(MarkdownEditor, { props: { value: "- one" } });
      select(5);

      await user.keyboard("{Enter}two");
      expect(bound()).toBe("- one\n- two");

      await user.keyboard("{Enter}{Enter}");
      expect(bound()).toBe("- one\n- two\n");
    });

    it("Enter on a plain line breaks it as usual", async () => {
      render(MarkdownEditor, { props: { value: "plain" } });
      select(5);

      await user.keyboard("{Enter}x");

      expect(bound()).toBe("plain\nx");
    });

    it("Shift+Enter breaks the line inside a list item", async () => {
      render(MarkdownEditor, { props: { value: "- one" } });
      select(5);

      await user.keyboard("{Shift>}{Enter}{/Shift}x");

      expect(bound()).toBe("- one\nx");
    });

    it("Tab indents an item, and Shift+Tab moves it out", async () => {
      render(MarkdownEditor, { props: { value: "- a\n- b" } });
      select(7);

      await user.keyboard("{Tab}");
      expect(bound()).toBe("- a\n  - b");
      expect(textarea()).toHaveFocus();

      await user.keyboard("{Shift>}{Tab}{/Shift}");
      expect(bound()).toBe("- a\n- b");
    });

    it("Tab moves focus off a list, and after Escape in a list", async () => {
      render(MarkdownEditor, { props: { value: "plain\n- a\n- b" } });
      select(2);

      await user.keyboard("{Tab}");
      expect(textarea()).not.toHaveFocus();
      expect(bound()).toBe("plain\n- a\n- b");

      select(13);
      await user.keyboard("{Escape}");
      expect(screen.getByText("Tab now moves focus.")).toBeInTheDocument();
      await user.keyboard("{Tab}");
      expect(textarea()).not.toHaveFocus();
      expect(bound()).toBe("plain\n- a\n- b");
    });

    it("leaves lines inside a code fence alone", async () => {
      render(MarkdownEditor, { props: { value: "```\n- a" } });
      select(7);

      await user.keyboard("{Enter}x");

      expect(bound()).toBe("```\n- a\nx");
    });
  });

  describe("IME composition", () => {
    it("does not run a shortcut or continue a list while composing", async () => {
      render(MarkdownEditor, { props: { value: "- あ" } });
      select(3);
      const field = textarea();

      await fireEvent.compositionStart(field);
      await fireEvent.keyDown(field, {
        key: "b",
        ctrlKey: true,
        isComposing: true,
      });
      await fireEvent.keyDown(field, { key: "b", ctrlKey: true, keyCode: 229 });
      expect(bound()).toBe("- あ");

      // A toolbar press mid-composition is ignored too.
      await fireEvent.click(screen.getByRole("button", { name: "Bold" }));
      expect(bound()).toBe("- あ");

      await fireEvent.compositionEnd(field);
      await fireEvent.click(screen.getByRole("button", { name: "Bold" }));
      expect(bound()).not.toBe("- あ");
    });
  });

  describe("maxCount", () => {
    it("counts the text and marks it over the limit", () => {
      render(MarkdownEditor, { props: { value: "abcdef", maxCount: 4 } });

      expect(screen.getByText("6/4")).toBeVisible();
      expect(textarea()).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("split view", () => {
    it("keeps the tabs in a narrow editor", () => {
      render(MarkdownEditor, { props: { split: true } });

      expect(screen.getByRole("tablist")).toBeVisible();
    });
  });
});
