import { render, screen } from "@testing-library/svelte";
import type BoxSource from "carbon-components-svelte/Box/Box.svelte";
import type { ComponentProps } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import BoxRef from "./Box.ref.test.svelte";
import Box from "./Box.test.svelte";

type BoxProps = ComponentProps<BoxSource>;

describe("Box", () => {
  it("binds `ref` to the rendered element", async () => {
    const { rerender } = render(BoxRef);

    expect(screen.getByTestId("ref-tag")).toHaveTextContent("DIV");

    // `tag` swaps the element, so the binding has to follow it.
    await rerender({ tag: "section" });
    expect(screen.getByTestId("ref-tag")).toHaveTextContent("SECTION");
  });

  it.each<[string, BoxProps, string[]]>([
    ["fill", { fill: "layer-01" }, ["bx--box-fill-layer-01"]],
    [
      "fill with border",
      { fill: "background", border: "subtle" },
      ["bx--box-fill-background", "bx--box-border-subtle"],
    ],
    ["fill accent", { fill: "layer-accent" }, ["bx--box-fill-layer-accent"]],
    ["fill brand", { fill: "brand" }, ["bx--box-fill-brand"]],
    [
      "dashed border",
      { border: "strong", borderStyle: "dashed" },
      ["bx--box-border-strong", "bx--box-border-style-dashed"],
    ],
    [
      "one-side border",
      { border: "subtle", borderSide: "top" },
      ["bx--box-border-subtle", "bx--box-border-side-top"],
    ],
    ["shadow", { shadow: true }, ["bx--box-shadow"]],
    ["display", { display: "flex" }, ["bx--box-display-flex"]],
    [
      "inline-block display",
      { display: "inline-block" },
      ["bx--box-display-inline-block"],
    ],
    ["hidden display", { display: "none" }, ["bx--box-display-none"]],
    ["overflow", { overflow: "auto" }, ["bx--box-overflow-auto"]],
    [
      "axis overflow",
      { overflowX: "auto", overflowY: "hidden" },
      ["bx--box-overflow-x-auto", "bx--box-overflow-y-hidden"],
    ],
    ["padding scale", { padding: 5 }, ["bx--box-p-5"]],
    [
      "axis padding scale",
      { paddingX: 3, paddingY: 5 },
      ["bx--box-px-3", "bx--box-py-5"],
    ],
    ["margin scale", { margin: 4 }, ["bx--box-m-4"]],
    [
      "axis padding over custom all-sides",
      { padding: "1rem", paddingX: 3 },
      ["bx--box-px-3"],
    ],
    [
      "axis margin over custom all-sides",
      { margin: "1rem", marginY: 3 },
      ["bx--box-my-3"],
    ],
    [
      "top, right and left padding",
      { paddingTop: 1, paddingRight: 2, paddingLeft: 3 },
      ["bx--box-pt-1", "bx--box-pr-2", "bx--box-pl-3"],
    ],
    [
      "x, right, bottom and left margin",
      { marginX: 2, marginRight: 3, marginBottom: 4, marginLeft: 5 },
      ["bx--box-mx-2", "bx--box-mr-3", "bx--box-mb-4", "bx--box-ml-5"],
    ],
    [
      "logical padding and margin",
      { paddingStart: 3, paddingEnd: 5, marginStart: 2, marginEnd: 4 },
      ["bx--box-ps-3", "bx--box-pe-5", "bx--box-ms-2", "bx--box-me-4"],
    ],
    ["max height scale", { maxHeight: 6 }, ["bx--box-max-height-6"]],
    [
      "bottom and right offsets",
      { position: "sticky", bottom: 1, right: 2 },
      ["bx--box-bottom-1", "bx--box-right-2"],
    ],
    [
      "side padding over axis and all-sides",
      { padding: "1rem", paddingY: 7, paddingBottom: 3 },
      ["bx--box-py-7", "bx--box-pb-3"],
    ],
    [
      "side margin over axis",
      { marginY: 7, marginTop: 3 },
      ["bx--box-my-7", "bx--box-mt-3"],
    ],
    [
      "side margin over custom all-sides",
      { margin: "1rem", marginTop: 3 },
      ["bx--box-mt-3"],
    ],
    ["full width", { fullWidth: true, maxWidth: 480 }, ["bx--box-full-width"]],
    ["gap scale", { display: "flex", gap: 3 }, ["bx--box-gap-3"]],
    [
      "direction",
      { display: "flex", direction: "column" },
      ["bx--box-direction-column"],
    ],
    ["wrap", { display: "flex", wrap: "wrap" }, ["bx--box-wrap-wrap"]],
    [
      "flex item",
      { alignSelf: "stretch", grow: true },
      ["bx--box-align-self-stretch", "bx--box-grow"],
    ],
    ["align", { display: "flex", align: "center" }, ["bx--box-align-center"]],
    [
      "justify",
      { display: "flex", justify: "space-between" },
      ["bx--box-justify-space-between"],
    ],
    ["hideBelow", { hideBelow: "md" }, ["bx--box-hide-below-md"]],
    ["hideAbove", { hideAbove: "md" }, ["bx--box-hide-above-md"]],
    [
      "combined modifiers",
      { fill: "layer-02", padding: 6, border: "subtle", class: "combined" },
      [
        "bx--box-fill-layer-02",
        "bx--box-p-6",
        "bx--box-border-subtle",
        "combined",
      ],
    ],
    [
      "viewport min height",
      { minHeight: "viewport" },
      ["bx--box-min-height-viewport"],
    ],
    ["height scale", { height: 7 }, ["bx--box-height-7"]],
    [
      "position and top offset",
      { position: "sticky", top: 0 },
      ["bx--box-position-sticky", "bx--box-top-0"],
    ],
    [
      "position and left offset",
      { position: "sticky", left: 0 },
      ["bx--box-position-sticky", "bx--box-left-0"],
    ],
    [
      "absolute position and offsets",
      { position: "absolute", left: 0, right: 0 },
      ["bx--box-position-absolute", "bx--box-left-0", "bx--box-right-0"],
    ],
  ])("adds utility classes: %s", (_, props, classes) => {
    render(Box, { props });

    expect(screen.getByTestId("box")).toHaveClass(...classes);
  });

  it.each<[string, BoxProps, RegExp | string]>([
    [
      "dashed style without a border token",
      { borderStyle: "dashed" },
      "bx--box-border-style-dashed",
    ],
    [
      "one-side border without a border token",
      { borderSide: "top" },
      "bx--box-border-side-top",
    ],
    ["scale class for padding 0", { padding: 0 }, /bx--box-p-\d/],
    [
      "direction, wrap, flex item, align and justify by default",
      { display: "flex" },
      /bx--box-(direction-|wrap|align-|justify-|grow)/,
    ],
  ])("omits classes: %s", (_, props, forbidden) => {
    render(Box, { props });

    const node = screen.getByTestId("box");
    if (typeof forbidden === "string") {
      expect(node).not.toHaveClass(forbidden);
    } else {
      expect(node.className).not.toMatch(forbidden);
    }
  });

  it.each<[string, BoxProps, Record<string, string>]>([
    [
      "border width",
      { border: "strong", borderWidth: 2 },
      { borderWidth: "2px" },
    ],
    [
      "border width without a border token",
      { borderWidth: 2 },
      { borderWidth: "" },
    ],
    [
      "one-side border width",
      { border: "strong", borderSide: "left", borderWidth: 3 },
      {
        borderTopWidth: "",
        borderRightWidth: "",
        borderBottomWidth: "",
        borderLeftWidth: "3px",
      },
    ],
    [
      "axis scale step over custom all-sides padding",
      { padding: "1rem", paddingX: 3 },
      { paddingLeft: "", paddingTop: "1rem" },
    ],
    [
      "axis scale step over custom all-sides margin",
      { margin: "1rem", marginY: 3 },
      { marginTop: "", marginLeft: "1rem" },
    ],
    [
      "single-side padding over axis and all-sides",
      { padding: "1rem", paddingY: 7, paddingBottom: 3 },
      { paddingTop: "", paddingBottom: "", paddingLeft: "1rem" },
    ],
    [
      "custom single-side margin",
      { marginBottom: "1.5rem", marginLeft: 0 },
      { marginBottom: "1.5rem", marginLeft: "0px", marginTop: "" },
    ],
    [
      "single-side scale margin over custom all-sides",
      { margin: "1rem", marginTop: 3 },
      {
        marginTop: "",
        marginRight: "1rem",
        marginBottom: "1rem",
        marginLeft: "1rem",
      },
    ],
    [
      "custom logical padding",
      { paddingStart: "1.5rem" },
      { paddingInlineStart: "1.5rem", paddingLeft: "", paddingRight: "" },
    ],
    [
      "custom axis margin fills the other logical side",
      { marginX: "1rem", marginStart: 2 },
      {
        marginInlineStart: "",
        marginInlineEnd: "1rem",
        marginLeft: "",
        marginRight: "",
      },
    ],
    [
      "custom all-sides padding with a logical side",
      { padding: "1rem", paddingEnd: "2rem" },
      // jsdom folds logical sides into physical ones, so check only the
      // logical values here; e2e/rtl.test.ts checks the real layout.
      {
        paddingTop: "1rem",
        paddingBottom: "1rem",
        paddingInlineStart: "1rem",
        paddingInlineEnd: "2rem",
      },
    ],
    ["max width", { fullWidth: true, maxWidth: 480 }, { maxWidth: "480px" }],
    [
      "custom width",
      { width: "12rem", minWidth: "8rem" },
      { width: "12rem", minWidth: "8rem" },
    ],
    // jsdom normalizes a unitless `0` to `0px` when reading it back.
    ["padding 0", { padding: 0 }, { padding: "0px" }],
    ["margin 0", { margin: 0 }, { margin: "0px" }],
    ["min height 0", { minHeight: 0 }, { minHeight: "0px" }],
    ["custom gap", { display: "flex", gap: "2rem" }, { gap: "2rem" }],
    [
      "numeric columns on a grid",
      { display: "grid", columns: 3 },
      { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
    ],
    [
      "string columns on a grid",
      { display: "grid", columns: "200px 1fr 200px" },
      { gridTemplateColumns: "200px 1fr 200px" },
    ],
    [
      "columns without display=grid",
      { columns: 3 },
      { gridTemplateColumns: "" },
    ],
    ["custom height", { height: "24rem" }, { height: "24rem" }],
    ["custom max height", { maxHeight: "20rem" }, { maxHeight: "20rem" }],
    [
      "custom right padding",
      { paddingRight: "1.5rem" },
      { paddingRight: "1.5rem", paddingLeft: "" },
    ],
    [
      "custom top, bottom and left offsets",
      { position: "sticky", top: "1rem", bottom: "2rem", left: "3rem" },
      { top: "1rem", bottom: "2rem", left: "3rem", right: "" },
    ],
    [
      "custom right offset",
      { position: "relative", right: "2rem" },
      { right: "2rem" },
    ],
  ])("sets inline styles: %s", (_, props, styles) => {
    render(Box, { props });

    expectInlineStyle(screen.getByTestId("box"), styles);
  });
});
