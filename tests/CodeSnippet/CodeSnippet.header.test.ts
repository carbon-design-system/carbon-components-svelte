import { render, screen } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import { user } from "../utils/user";
import CodeSnippetFiles from "./CodeSnippetFiles.test.svelte";
import { mockClipboard } from "./helpers";

const files = [
  { title: "App.svelte", code: "<Button>Save</Button>" },
  { title: "main.ts", code: "new App();" },
  { title: "style.css", code: "a { color: red }" },
];

describe("CodeSnippet header", () => {
  it("names the code container by its title", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code: "x", title: "src/App.svelte" },
    });
    const title = container.querySelector(".bx--snippet__title");
    expect(title).toHaveTextContent("src/App.svelte");
    expect(screen.getByRole("textbox")).toHaveAccessibleName("src/App.svelte");
  });

  it("keeps a consumer's label over the title", () => {
    render(CodeSnippet, {
      props: { type: "multi", code: "x", title: "a.ts", "aria-label": "Mine" },
    });
    expect(screen.getByRole("textbox")).toHaveAccessibleName("Mine");
  });

  it("has no header for a single snippet", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "single", code: "x", title: "a.ts" },
    });
    expect(container.querySelector(".bx--snippet__header")).toBeNull();
  });

  it("shows the selected file in a tab panel named by its tab", () => {
    render(CodeSnippet, {
      props: { type: "multi", files, selectedIndex: 1 },
    });
    expect(screen.getByRole("tablist")).toHaveAccessibleName("Files");
    expect(screen.getAllByRole("tab").map((tab) => tab.ariaSelected)).toEqual([
      "false",
      "true",
      "false",
    ]);
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAccessibleName("main.ts");
    expect(panel).toHaveTextContent("new App();");
    expect(screen.getByRole("tab", { name: "main.ts" })).toHaveAttribute(
      "aria-controls",
      panel.id,
    );
  });

  it("copies the selected file, and tells which was chosen", async () => {
    const writeText = mockClipboard();
    const onChange = vi.fn();
    render(CodeSnippetFiles, { props: { onChange } });
    await user.click(screen.getByRole("tab", { name: "style.css" }));
    expect(onChange).toHaveBeenCalledWith({
      selectedIndex: 2,
      title: "style.css",
    });
    expect(screen.getByTestId("bound")).toHaveTextContent("2");
    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(writeText).toHaveBeenCalledWith("a { color: red }");
  });

  it("moves between tabs with the arrow keys, Home and End", async () => {
    render(CodeSnippet, { props: { type: "multi", files } });
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(tabs[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("keeps only the selected tab in the tab order", () => {
    render(CodeSnippet, { props: { type: "multi", files, selectedIndex: 2 } });
    expect(screen.getAllByRole("tab").map((tab) => tab.tabIndex)).toEqual([
      -1, -1, 0,
    ]);
  });

  it("clamps an out-of-range selected index", () => {
    render(CodeSnippet, { props: { type: "multi", files, selectedIndex: 9 } });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("a { color: red }");
  });
});
