// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// A chat UI reads the v11 chat-* tokens. In the dark themes the chat shell
// and agent bubbles are the page background; g80 has no v11 values, so its
// chat tokens follow its own surfaces instead of borrowing g90's.
describe("chat tokens", () => {
  it.each(["g80", "g90"])(
    "%s draws the chat shell on the page background",
    async (theme) => {
      const rules = parseRules(await compileEntry("all.scss"));
      const token = (name: string) =>
        [`:root[theme=${theme}]`, ":root"]
          .map((s) =>
            rules.find(
              (r) => r.selector === s && r.context === "" && r.decls.has(name),
            ),
          )
          .find(Boolean)
          ?.decls.get(name);
      const background = token("--cds-background");
      expect(token("--cds-chat-shell-background")).toBe(background);
      expect(token("--cds-chat-bubble-agent")).toBe(background);
      expect(token("--cds-chat-bubble-user")).toBe(token("--cds-layer-01"));
    },
    30_000,
  );
});

// ChatButton's quick action reads the v11 chat-button-* tokens: its outline
// and label at rest, a fill on hover, press and select. A static theme
// compiles each to that theme's value.
describe("chat button tokens", () => {
  const QUICK = ".bx--chat-btn--quick-action";
  const SELECTED = `${QUICK}--selected`;
  const HOVER = `${QUICK}:hover:not(:active):not([disabled])`;

  const decl = (
    rules: ReturnType<typeof parseRules>,
    selector: string,
    name: string,
    context = "",
  ) =>
    rules
      .find((r) => r.selector === selector && r.context === context)
      ?.decls.get(name);

  it("reads every chat-button token in all.css", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const hover = "@media (any-hover:hover)";

    expect(decl(rules, QUICK, "border")).toBe(
      "1px solid var(--cds-chat-button)",
    );
    expect(decl(rules, QUICK, "color")).toBe("var(--cds-chat-button)");
    expect(decl(rules, HOVER, "background", hover)).toBe(
      "var(--cds-chat-button-hover)",
    );
    expect(decl(rules, HOVER, "color", hover)).toBe(
      "var(--cds-chat-button-text-hover)",
    );
    expect(decl(rules, `${QUICK}:active`, "background")).toBe(
      "var(--cds-chat-button-active)",
    );
    expect(decl(rules, SELECTED, "background")).toBe(
      "var(--cds-chat-button-selected)",
    );
    expect(decl(rules, SELECTED, "color")).toBe(
      "var(--cds-chat-button-text-selected)",
    );
  }, 30_000);

  it.each([
    ["white.scss", "#0f62fe", "#525252"],
    ["g100.scss", "#78a9ff", "#c6c6c6"],
  ])(
    "%s compiles the tokens to the theme's values",
    async (entry, outline, selected) => {
      const rules = parseRules(await compileEntry(entry));
      expect(decl(rules, QUICK, "color")).toBe(outline);
      expect(decl(rules, SELECTED, "color")).toBe(selected);
    },
    30_000,
  );

  it("gives a selected quick action the system highlight in forced colors", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const forced = "@media (forced-colors:active)";
    for (const selector of [
      `${QUICK}${SELECTED}:not([disabled])`,
      `${QUICK}${SELECTED}:not([disabled]):hover`,
      `${QUICK}${SELECTED}[disabled]`,
    ]) {
      expect(decl(rules, selector, "background-color", forced)).toBe(
        "Highlight",
      );
      expect(decl(rules, selector, "color", forced)).toBe("HighlightText");
    }
  }, 30_000);
});
