import { render, screen } from "@testing-library/svelte";
import LayerTest from "./Layer.test.svelte";

describe("Layer", () => {
  it("puts a top-level layer on level 1 (layer two)", () => {
    render(LayerTest);
    expect(screen.getByTestId("outer")).toHaveClass("bx--layer-two");
    expect(screen.getByTestId("outer-level")).toHaveTextContent("1");
  });

  it("steps each nested layer up one level, capped at level 2", () => {
    render(LayerTest);
    expect(screen.getByTestId("middle")).toHaveClass("bx--layer-three");
    expect(screen.getByTestId("middle-level")).toHaveTextContent("2");
    expect(screen.getByTestId("inner")).toHaveClass("bx--layer-three");
    expect(screen.getByTestId("capped")).toHaveClass("bx--layer-three");
  });

  it("starts from an explicit level, and nested layers continue from it", () => {
    render(LayerTest, { props: { level: 0 } });
    expect(screen.getByTestId("outer")).toHaveClass("bx--layer-one");
    expect(screen.getByTestId("middle")).toHaveClass("bx--layer-two");
    expect(screen.getByTestId("inner")).toHaveClass("bx--layer-three");
  });

  it("lets a nested layer set its own level, and continues from it", () => {
    render(LayerTest);
    expect(screen.getByTestId("reset-outer")).toHaveClass("bx--layer-two");
    expect(screen.getByTestId("reset-nested")).toHaveClass("bx--layer-one");
    expect(screen.getByTestId("reset-child")).toHaveClass("bx--layer-two");
  });

  it("follows a level change", async () => {
    const { rerender } = render(LayerTest, { props: { level: 2 } });
    expect(screen.getByTestId("outer")).toHaveClass("bx--layer-three");
    await rerender({ level: 0 });
    expect(screen.getByTestId("outer")).toHaveClass("bx--layer-one");
    expect(screen.getByTestId("middle")).toHaveClass("bx--layer-two");
  });

  it("paints the background only with withBackground", async () => {
    const { rerender } = render(LayerTest);
    expect(screen.getByTestId("outer")).not.toHaveClass(
      "bx--layer__with-background",
    );
    await rerender({ withBackground: true });
    expect(screen.getByTestId("outer")).toHaveClass(
      "bx--layer__with-background",
    );
  });

  it("renders the tag and keeps a custom class", () => {
    render(LayerTest, { props: { tag: "section" } });
    const outer = screen.getByTestId("outer");
    expect(outer.tagName).toBe("SECTION");
    expect(outer).toHaveClass("custom", "bx--layer-two");
  });
});
