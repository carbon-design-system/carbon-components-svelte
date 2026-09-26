// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("page header", () => {
  it("matches the selected container tab to the page background on a layered header", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const rule = rules.find(
      (r) =>
        r.selector.startsWith(
          ".bx--page-header:not(.bx--box-fill-background)",
        ) && r.selector.includes(".bx--tabs__nav-item--selected"),
    );
    // White theme: `$ui-background` is #ffffff, `$ui-01` is #f4f4f4.
    expect(rule?.decls.get("background-color")).toBe("#ffffff");
  }, 30_000);

  it("bleeds default tabs so tab labels align with the title", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const row = rules.find((r) => r.selector === ".bx--page-header__tabs-row");
    // Cancels the header's bottom padding, whatever its size.
    expect(row?.decls.get("margin-block-end")).toBe(
      "calc(-1*var(--ccs-page-header-padding-block))",
    );
    expect(row?.decls.has("margin-inline")).toBe(false);

    // Default (not container) tabs cancel the inline padding.
    const bleed = rules.find(
      (r) =>
        r.selector ===
        ".bx--page-header:not(.bx--page-header--container-tabs) .bx--page-header__tabs-row",
    );
    expect(bleed?.decls.get("margin-inline")).toBe("-1rem");

    // Tabs overlap the divider by 1px; container tabs never get a divider.
    const overlap = rules.find(
      (r) =>
        r.selector === ".bx--page-header--divider .bx--page-header__tabs-row",
    );
    expect(overlap?.decls.get("margin-block-end")).toBe(
      "calc(-1*var(--ccs-page-header-padding-block) - 1px)",
    );
  }, 30_000);

  it("continues the selected container tab's surface into body panels", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const panelRules = rules.filter(
      (r) =>
        r.selector.startsWith(".bx--page-header--container-tabs") &&
        r.decls.has("background-color") &&
        r.selector
          .replace(/\s/g, "")
          .endsWith("+.bx--page-header__body>.bx--tab-content"),
    );
    // `$ui-01` on the default header, `$ui-background` on a layered one.
    expect(
      panelRules.map((r) => [
        r.selector.includes(":not(.bx--box-fill-background)"),
        r.decls.get("background-color"),
      ]),
    ).toEqual([
      [false, "#f4f4f4"],
      [true, "#ffffff"],
    ]);
  }, 30_000);

  it("insets the body to line panels up with container tabs", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const body = rules.find(
      (r) =>
        r.selector.startsWith(".bx--page-header--container-tabs") &&
        r.selector.replace(/\s/g, "").endsWith("+.bx--page-header__body"),
    );
    expect(body?.decls.get("padding-inline")).toBe("1rem");
  }, 30_000);

  it("lays out mixed action controls in one row", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const rule = rules.find((r) => r.selector === ".bx--page-header__actions");
    expect(rule?.decls.get("display")).toBe("flex");
    expect(rule?.decls.get("align-items")).toBe("center");
  }, 30_000);

  it("lays out the eyebrow icon and text in a row", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const eyebrow = rules.find(
      (r) => r.selector === ".bx--page-header__eyebrow",
    );
    expect(eyebrow?.decls.get("display")).toBe("flex");
    expect(eyebrow?.decls.get("align-items")).toBe("center");
    expect(eyebrow?.decls.get("gap")).toBe("0.375rem");
    const icon = rules.find(
      (r) => r.selector === ".bx--page-header__eyebrow svg",
    );
    expect(icon?.decls.get("fill")).toBe("currentColor");
    // One size, whatever `size` the icon component was given.
    expect(icon?.decls.get("width")).toBe("1rem");
    expect(icon?.decls.get("height")).toBe("1rem");
  }, 30_000);

  it("gives the grid-mode content and body Grid's container padding", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const container = (r: { selector: string }) =>
      r.selector.includes(".bx--page-header--grid>.bx--page-header__content") ||
      r.selector.includes(".bx--page-header--grid > .bx--page-header__content");
    const gridRules = rules.filter((r) => r.selector === ".bx--grid");
    const pageRules = rules.filter(container);

    // Same padding at every breakpoint as `.bx--grid`, plus its max width.
    const paddings = (list: typeof rules) =>
      list.map((r) => r.decls.get("padding-left")).filter(Boolean);
    expect(paddings(pageRules)).toEqual(paddings(gridRules));
    expect(pageRules[0]?.decls.get("max-width")).toBe("99rem");
  }, 30_000);

  it("tightens the vertical rhythm for size sm", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const header = rules.find((r) => r.selector === ".bx--page-header");
    expect(header?.decls.get("--ccs-page-header-padding-block")?.trim()).toBe(
      "1rem",
    );
    expect(header?.decls.get("padding-block")).toBe(
      "var(--ccs-page-header-padding-block)",
    );

    const small = rules.find((r) => r.selector === ".bx--page-header--sm");
    expect(small?.decls.get("--ccs-page-header-padding-block")?.trim()).toBe(
      "0.75rem",
    );
    expect(small?.decls.get("--ccs-page-header-row-gap")?.trim()).toBe(
      "0.75rem",
    );
  }, 30_000);

  it("lays out tabsEnd beside the tabs only when present", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const row = rules.find(
      (r) => r.selector === ".bx--page-header__tabs-row--with-end",
    );
    expect(row?.decls.get("display")).toBe("flex");

    // Undoes the default-tab bleed so the controls line up with the actions.
    const end = rules.find(
      (r) =>
        r.selector ===
        ".bx--page-header:not(.bx--page-header--container-tabs) .bx--page-header__tabs-end",
    );
    expect(end?.decls.get("margin-inline-end")).toBe("1rem");
  }, 30_000);
});
