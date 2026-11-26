import { render, screen } from "@testing-library/svelte";
import Highlight from "carbon-components-svelte/Highlight/Highlight.svelte";
import HighlightHost from "./Highlight.test.svelte";

const marks = (container: Element) =>
  [...container.querySelectorAll("mark")].map((mark) => mark.textContent);

describe("Highlight", () => {
  it("marks each match and leaves the text whole", () => {
    const { container } = render(Highlight, {
      props: { text: "Café au lait, cafe noir", query: "cafe" },
    });

    expect(marks(container)).toEqual(["Café", "cafe"]);
    expect(container.textContent).toBe("Café au lait, cafe noir");
    expect(container.querySelector("mark")).toHaveClass("bx--highlight__mark");
  });

  it("adds no whitespace between the marked and plain runs", () => {
    const { container } = render(Highlight, {
      props: { text: "abcdef", query: "cd" },
    });

    expect(container.textContent).toBe("abcdef");
    expect(marks(container)).toEqual(["cd"]);
  });

  it("renders plain text when nothing matches", () => {
    const { container } = render(Highlight, {
      props: { text: "Hello", query: "zzz" },
    });

    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("Hello");
  });

  it("follows a changing query and text", async () => {
    const { container, rerender } = render(Highlight, {
      props: { text: "Hello", query: "ell" },
    });
    expect(marks(container)).toEqual(["ell"]);

    await rerender({ query: "" });
    expect(marks(container)).toEqual([]);

    await rerender({ text: "Yellow", query: "ell" });
    expect(marks(container)).toEqual(["ell"]);
    expect(container.textContent).toBe("Yellow");
  });

  it("marks the given ranges instead of the query, widened to whole characters", () => {
    const { container } = render(Highlight, {
      props: {
        text: "a😀b",
        query: "b",
        ranges: [{ start: 2, end: 3 }],
      },
    });

    expect(marks(container)).toEqual(["😀"]);
    expect(container.textContent).toBe("a😀b");
  });

  it("never turns text into markup", () => {
    const text = '<img src=x onerror="alert(1)"> &amp; <b>bold</b>';
    const { container } = render(Highlight, {
      props: { text, query: "img bold &amp;" },
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toBe(text);
    expect(marks(container)).toEqual(["img", "&amp;", "bold"]);
  });

  it("passes the match options to the matcher", async () => {
    const { container, rerender } = render(Highlight, {
      props: { text: "Foo foo", query: "foo", caseSensitive: true },
    });
    expect(marks(container)).toEqual(["foo"]);

    await rerender({ caseSensitive: false, mode: "prefix" });
    expect(marks(container)).toEqual(["Foo"]);

    await rerender({
      mode: "substring",
      text: "Café",
      query: "cafe",
      ignoreDiacritics: false,
    });
    expect(marks(container)).toEqual([]);
  });

  it("styles the bold variant and adds a custom class", () => {
    const { container } = render(Highlight, {
      props: { text: "abc", query: "b", variant: "bold", markClass: "mine" },
    });
    const mark = container.querySelector("mark");

    expect(mark).toHaveClass("bx--highlight__mark--bold");
    expect(mark).toHaveClass("mine");
  });

  it("renders a span, not a mark, when decorative", () => {
    const { container } = render(Highlight, {
      props: { text: "abc", query: "b", decorative: true },
    });

    expect(container.querySelector("mark")).toBeNull();
    const span = container.querySelector("span.bx--highlight__mark");
    expect(span?.textContent).toBe("b");
  });

  it("keeps the full text as the accessible name", () => {
    render(HighlightHost);

    expect(
      screen.getByRole("button", { name: "Café au lait" }),
    ).toBeInTheDocument();
  });

  it("marks a Latin term inside right-to-left text, with the text intact", () => {
    const text = "مرحبا بك في hello world";
    render(HighlightHost, { props: { text, query: "hello", dir: "rtl" } });
    const host = screen.getByTestId("host");

    expect(host.textContent).toBe(text);
    expect(host.querySelector("mark")?.textContent).toBe("hello");
    // The mark adds no embedding or isolate, which would reorder the run.
    expect(host.querySelector("mark")?.getAttribute("dir")).toBeNull();
    expect(host.querySelector("mark")?.getAttribute("style")).toBeNull();
  });

  it("marks an Arabic term inside Latin text and a Hebrew one with points", () => {
    const { container } = render(Highlight, {
      props: { text: "see مَرْحَبًا and שָׁלוֹם", query: "مرحبا שלום" },
    });

    expect(marks(container)).toEqual(["مَرْحَبًا", "שָׁלוֹם"]);
  });
});
