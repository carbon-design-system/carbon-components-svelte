import { render, screen } from "@testing-library/svelte";
import Markdown from "./Markdown.test.svelte";

const root = () => screen.getByTestId("md");

describe("Markdown", () => {
  it("draws blocks as plain elements", () => {
    render(Markdown, {
      source: "# Title\n\nHello **bold** and `code`.\n\n- a\n- b\n\n1. x\n2. y",
    });

    expect(
      screen.getByRole("heading", { level: 3, name: "Title" }),
    ).toBeVisible();
    expect(root().querySelector("strong")?.textContent).toBe("bold");
    expect(root().querySelector("code")?.textContent).toBe("code");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("never puts markup from the text into the page", () => {
    render(Markdown, {
      source: [
        '<img src=x onerror="window.pwned=1">',
        "<script>window.pwned = 1</script>",
        "[a](javascript:window.pwned=1)",
        "[b](JaVaScRiPt:alert(1))",
        "![c](data:text/html;base64,AAAA)",
        "[<b onmouseover=alert(1)>d</b>](https://example.com)",
      ].join("\n\n"),
    });

    expect(root().querySelector("img, script, b, iframe")).toBeNull();
    for (const link of root().querySelectorAll("a")) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\/example\.com/);
    }
    expect(root().textContent).toContain("<script>window.pwned = 1</script>");
    expect((window as unknown as { pwned?: number }).pwned).toBeUndefined();
  });

  it("opens links safely and shows the real address of a claimed one", () => {
    render(Markdown, {
      source:
        "[docs](https://example.com/a) [https://bank.com](https://evil.example/)",
    });

    const [docs, spoof] = [...root().querySelectorAll("a")];
    expect(docs).toHaveAttribute("target", "_blank");
    expect(docs.getAttribute("rel")).toContain("noopener");
    expect(docs.getAttribute("rel")).toContain("noreferrer");
    expect(spoof.textContent).toBe("https://evil.example/");
  });

  it("names a code block and offers to copy its text", () => {
    render(Markdown, { source: "```js\nconst a = 1;\n```" });

    const figure = screen.getByRole("figure", { name: "js" });
    expect(figure.querySelector("pre")?.textContent).toBe("const a = 1;");
    expect(
      screen.getByRole("button", { name: "Copy code" }),
    ).toBeInTheDocument();
  });

  it("colors code with the tokens a function returns", () => {
    render(Markdown, {
      source: "```js\nlet a\n```",
      highlight: (code: string) => [
        { type: "keyword", text: "let" },
        { type: null, text: code.slice(3) },
      ],
    });

    expect(root().querySelector("pre .tok-keyword")?.textContent).toBe("let");
    expect(root().querySelector("pre")?.textContent).toBe("let a");
  });

  it("leaves finished blocks' elements alone as the last one grows", async () => {
    const { rerender } = render(Markdown, {
      source: "First paragraph.\n\nSecond paragraph.\n\nThi\n",
      streaming: true,
    });
    const first = root().querySelectorAll("p")[0];
    const second = root().querySelectorAll("p")[1];

    await rerender({
      source: "First paragraph.\n\nSecond paragraph.\n\nThird\n",
    });
    await rerender({
      source: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph\n",
    });

    expect(root().querySelectorAll("p")[0]).toBe(first);
    expect(root().querySelectorAll("p")[1]).toBe(second);
    expect(root().querySelectorAll("p")[2].textContent).toBe("Third paragraph");
  });

  it("ends the streaming text with a caret that the page ignores", async () => {
    const { rerender } = render(Markdown, {
      source: "Hello **wor",
      streaming: true,
    });

    const caret = root().querySelector(".bx--markdown__caret");
    expect(caret).toHaveAttribute("aria-hidden", "true");
    expect(root().querySelector("strong")?.textContent).toBe("wor");

    await rerender({ streaming: false });
    expect(root().querySelector(".bx--markdown__caret")).toBeNull();
    expect(root().querySelector("strong")).toBeNull();
    expect(root().textContent?.trim()).toBe("Hello **wor");
  });

  it("draws a table in a region that scrolls and takes focus", () => {
    render(Markdown, { source: "| a | b |\n|:-:|--:|\n| 1 | 2 |" });

    const region = screen.getByRole("group", { name: "Table" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "2" })).toHaveAttribute(
      "align",
      "right",
    );
  });

  it("lets each paragraph choose its own direction", () => {
    render(Markdown, { source: "مرحبا `npm i` بالعالم\n\nHello" });

    for (const p of root().querySelectorAll("p")) {
      expect(p).toHaveAttribute("dir", "auto");
    }
  });
});
