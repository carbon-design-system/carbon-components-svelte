// @vitest-environment node
import {
  addedApi,
  isComponent,
  misfiledApi,
  parseTitle,
  publicApi,
} from "../../scripts/lib/public-api";

const BASE = `<script>
  /**
   * @event {{ open: boolean }} toggle
   * @slot {{}} labelChildren - Replaces the label text.
   */

  /**
   * @typedef {object} Item
   * @property {string} id
   * @property {string} [text] - The visible text
   */

  /** @typedef {{ value: number; max?: number }} Detail */

  /** Set to \`true\` to open */
  export let open = false;

  const dispatch = createEventDispatcher();
</script>

<button on:click on:keydown={handle} on:mouseenter|once>
  <slot name="labelChildren">{labelText}</slot>
  <slot />
</button>`;

const FILE = "src/Thing/Thing.svelte";
const withProp = BASE.replace(
  "export let open = false;",
  "export let open = false;\n\n  /** Set the size */\n  export let size = undefined;",
);
const without = (text: string) => BASE.replace(text, "");

describe("publicApi", () => {
  it("reads props, slots, events and fields", () => {
    expect([...publicApi(BASE)].sort()).toEqual([
      "event click",
      "event mouseenter",
      "event toggle",
      "field Detail.max",
      "field Detail.value",
      "field Item.id",
      "field Item.text",
      "field event toggle.open",
      "prop open",
      "slot default",
      "slot labelChildren",
    ]);
  });

  it.each([
    ["a prop", withProp, "prop size"],
    [
      "a slot",
      BASE.replace("<slot />", '<slot />\n  <slot name="icon" />'),
      "slot icon",
    ],
    [
      "a forwarded event",
      BASE.replace("on:click", "on:click on:focus"),
      "event focus",
    ],
    [
      "a dispatched event",
      `${BASE}\n<script>dispatch("close");</script>`,
      "event close",
    ],
    [
      "a typedef field",
      BASE.replace(
        "@property {string} id",
        "@property {string} id\n   * @property {boolean} [disabled]",
      ),
      "field Item.disabled",
    ],
    [
      "an inline typedef field",
      BASE.replace("max?: number", "max?: number; step: number"),
      "field Detail.step",
    ],
    [
      "an event detail field",
      BASE.replace("{{ open: boolean }}", "{{ open: boolean; id: string }}"),
      "field event toggle.id",
    ],
  ])("finds %s the head adds", (_, head, api) => {
    expect(addedApi(BASE, head)).toEqual([api]);
  });

  it("ignores markup in comments and scripts", () => {
    const head = `${BASE}\n<!-- <slot name="hint" /> on:focus -->\n<script>
  const html = '<slot name="tip"> on:blur ';
</script>`;
    expect(addedApi(BASE, head)).toEqual([]);
  });

  it("ignores a moved prop and a changed type or description", () => {
    const head = BASE.replace(
      "/** Set to `true` to open */\n  export let open = false;",
      "",
    )
      .replace("{{ value: number;", "{{ value: string;")
      .replace("- The visible text", "- The label")
      .replace(
        "const dispatch",
        "/** Open it */\n  export let open = true;\n  const dispatch",
      );
    expect(addedApi(BASE, head)).toEqual([]);
  });
});

describe("parseTitle", () => {
  it.each([
    ["fix(tag): a", "", { type: "fix", breaking: false }],
    ["fix(tag)!: a", "", { type: "fix", breaking: true }],
    ["refactor!: a", "", { type: "refactor", breaking: true }],
    ["fix: a", "Body.\n\nBREAKING CHANGE: b", { type: "fix", breaking: true }],
    ["Fix the tag", "", { type: undefined, breaking: false }],
  ])("reads %j", (title, body, parsed) => {
    expect(parseTitle(title, body)).toEqual(parsed);
  });
});

describe("misfiledApi", () => {
  const added = [{ path: FILE, base: BASE, head: withProp }];

  it.each(["fix", "chore", "refactor", "perf"])(
    "flags a new prop under %s",
    (type) => {
      expect(misfiledApi(`${type}(thing): a`, "", added)).toEqual([
        { path: FILE, api: "prop size" },
      ]);
    },
  );

  it.each([
    ["feat", "feat(thing): a", ""],
    ["a breaking fix", "fix(thing)!: a", ""],
    ["a breaking footer", "fix(thing): a", "BREAKING CHANGE: renames open"],
    ["docs", "docs(thing): a", ""],
    ["a title with no type", "Thing: a", ""],
  ])("passes a new prop under %s", (_, title, body) => {
    expect(misfiledApi(title, body, added)).toEqual([]);
  });

  it("passes a removal under fix", () => {
    const removed = [
      { path: FILE, base: BASE, head: without("export let open = false;") },
    ];
    expect(misfiledApi("fix(thing): a", "", removed)).toEqual([]);
  });

  it("flags a new component under fix", () => {
    const created = [{ path: FILE, base: "", head: BASE }];
    expect(misfiledApi("fix(thing): a", "", created)).toHaveLength(11);
  });
});

describe("isComponent", () => {
  it.each([
    [FILE, true],
    ["src/index.js", false],
    ["docs/src/pages/Thing.svelte", false],
  ])("%s -> %s", (path, expected) => {
    expect(isComponent(path)).toBe(expected);
  });
});
