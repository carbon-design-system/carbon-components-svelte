// @vitest-environment node
// @reads src/**/*.svelte
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findHardCodedEnglish, looksEnglish } from "./hard-coded-english";

const SRC = join(__dirname, "../../src");

const FILES = readdirSync(SRC, { recursive: true, encoding: "utf8" })
  .filter((name) => name.endsWith(".svelte"))
  .sort();

// Hard-coded English that predates this check, as a count per
// `kind: file`. The comparison is exact, so fixing one means lowering its
// count here, and the map only ever shrinks. Do not raise a count or add an
// entry: make the string a `*Text` prop (COMPONENT_GUIDELINES, "Props").
// Every entry is an `expression`: a fallback inside an attribute or a
// `{...}` tag for a prop whose default is `undefined`, so the English never
// shows in the string table. Moving each into its prop's default changes
// what `undefined` means for that prop, so each needs its own change.
const KNOWN_VIOLATIONS: Record<string, number> = {
  // "Slide 2 of 5" is built by concatenation; it needs a function prop.
  "expression: Carousel/CarouselItem.svelte": 2,
  "expression: DatePicker/DateCalendar.svelte": 1,
  "expression: FileUploader/Filename.svelte": 4,
  "expression: InlineEdit/InlineEdit.svelte": 1,
  "expression: Search/Search.svelte": 1,
  "expression: Slider/Slider.svelte": 1,
  "expression: Toggle/Toggle.svelte": 1,
  "expression: Toggle/ToggleSkeleton.svelte": 1,
};

// Text that is not for people: one entry per `kind: file: text`, with the
// reason. Do not exempt a string a user can see or hear.
const EXEMPT: Record<string, string> = {};

describe("hard-coded English in markup", () => {
  it("finds every component", () => {
    expect(FILES.length).toBeGreaterThan(300);
  });

  it("adds none beyond the known baseline", () => {
    const counts: Record<string, number> = {};
    const changed: string[] = [];
    for (const file of FILES) {
      const hits = findHardCodedEnglish(
        readFileSync(join(SRC, file), "utf8"),
      ).filter((hit) => !(`${hit.kind}: ${file}: ${hit.text}` in EXEMPT));
      for (const kind of ["text", "attribute", "expression"] as const) {
        const found = hits.filter((hit) => hit.kind === kind);
        const key = `${kind}: ${file}`;
        if (found.length > 0) counts[key] = found.length;
        if (found.length !== (KNOWN_VIOLATIONS[key] ?? 0)) {
          changed.push(
            ...found.map((hit) => `${file}:${hit.line} ${kind} "${hit.text}"`),
            ...(found.length === 0
              ? [`${key}: fixed, lower the baseline`]
              : []),
          );
        }
      }
    }
    // Lists the `file:line` of any file whose count moved.
    expect(changed).toEqual([]);
    expect(counts).toEqual(KNOWN_VIOLATIONS);
  });
});

describe("findHardCodedEnglish", () => {
  const find = (markup: string) =>
    findHardCodedEnglish(`<script>export let x;</script>\n${markup}`);

  it("reports literal text nodes with their line", () => {
    expect(find("<div>\n  <span>Close menu</span>\n</div>")).toEqual([
      { kind: "text", line: 3, text: "Close menu" },
    ]);
  });

  it("reports slot fallbacks", () => {
    expect(find("<slot>Cancel</slot>")).toEqual([
      { kind: "text", line: 2, text: "Cancel" },
    ]);
  });

  it("reports literal aria-label, title, placeholder and alt", () => {
    const hits = find(
      '<input placeholder="Search here" /><img alt="A cat" title="Cat" /><a aria-label="Open">x</a>',
    );

    expect(hits.map((hit) => [hit.kind, hit.text])).toEqual([
      ["attribute", "Search here"],
      ["attribute", "A cat"],
      ["attribute", "Cat"],
      ["attribute", "Open"],
    ]);
  });

  it("reports string literals in those attributes and in tags", () => {
    const hits = find(
      '<a aria-label={x ? "Open menu" : `Close ` + x}>{x ?? "Nothing here"}</a>',
    );

    expect(hits.map((hit) => [hit.kind, hit.text])).toEqual([
      ["expression", "Open menu"],
      ["expression", "Close"],
      ["expression", "Nothing here"],
    ]);
  });

  it("ignores the markup of other attributes, scripts and comparisons", () => {
    expect(
      find(
        '<style>.a { content: "Hello there"; }</style><div class="bx--tag" style:width="{x}px" data-label="Some text" aria-label={x}>{x === "open one" ? 1 : 2}{props["aria-label"]}{" "}</div>',
      ),
    ).toEqual([]);
  });
});

describe("looksEnglish", () => {
  it.each([
    "Cancel",
    "Skip to main content",
    "Loading...",
    "pagination",
    "Wk",
    "Cancel ",
  ])("reads %j as English", (value) => {
    expect(looksEnglish(value)).toBe(true);
  });

  it.each([
    "",
    " ",
    "–",
    "/",
    "+",
    "100%",
    "0 0 32 32",
    "aria-label",
    "bx--tag",
    "collapseAll",
    "http://www.w3.org/2000/svg",
    "M17 15L17 8z",
    "↳",
  ])("does not read %j as English", (value) => {
    expect(looksEnglish(value)).toBe(false);
  });
});
