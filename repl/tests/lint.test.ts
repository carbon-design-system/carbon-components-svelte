import { describe, expect, test } from "bun:test";
import { parse } from "svelte/compiler";
import "../public/lint.js";

type Lint = (
  source: string,
  filename: string,
  context: { api: unknown; parse: typeof parse; isEntry: boolean },
) => { code: string; message: string }[];
const { lint } = (globalThis as unknown as { ccsLint: { lint: Lint } }).ccsLint;

const api = {
  components: {
    TextInput: {
      path: "src/TextInput/TextInput.svelte",
      props: [
        { name: "labelText" },
        { name: "value" },
        { name: "placeholder" },
      ],
      events: [{ name: "input" }, { name: "change" }, { name: "blur" }],
      rest: { type: "Element", name: "input" },
    },
    Tag: {
      path: "src/Tag/Tag.svelte",
      props: [{ name: "type" }],
      events: [],
    },
    Tabs: {
      path: "src/Tabs/Tabs.svelte",
      props: [{ name: "selected" }],
      events: [],
    },
    Tab: {
      path: "src/Tabs/Tab.svelte",
      props: [{ name: "label" }],
      events: [],
      rest: { type: "Element", name: "li" },
      requires: [["carbon:Tabs"]],
    },
  },
  providers: { "carbon:Tabs": ["Tabs"] },
};

const run = (markup: string, isEntry = true) =>
  lint(
    `<script>\n  import { TextInput, Tag, Tabs, Tab } from "carbon-components-svelte";\n</script>\n${markup}`,
    "App.svelte",
    { api, parse, isEntry },
  ).map((d: { code: string; message: string }) => `${d.code}: ${d.message}`);

describe("ccs lint", () => {
  test("suggestions allow swaps and stay strict for short names", () => {
    const { suggest } = (
      globalThis as unknown as {
        ccsLint: { suggest: (n: string, c: string[]) => string | undefined };
      }
    ).ccsLint;
    expect(suggest("vlaue", ["value", "label"])).toBe("value");
    expect(suggest("chnage", ["change", "input"])).toBe("change");
    expect(suggest("kind", ["id", "type"])).toBeUndefined();
    expect(suggest("LabelText", ["labelText"])).toBe("labelText");
  });

  test("typo'd props get a suggestion", () => {
    expect(run(`<TextInput lableText="Name" />`)).toEqual([
      'ccs/unknown-prop: TextInput has no prop "lableText". Did you mean "labelText"?',
    ]);
  });

  test("HTML and aria attributes pass through components with rest props", () => {
    expect(
      run(
        `<TextInput labelText="Name" name="n" aria-describedby="x" data-id="1" />`,
      ),
    ).toEqual([]);
  });

  test("unknown attributes on a component without rest props are reported", () => {
    expect(run(`<Tag kind="red">x</Tag>`)).toEqual([
      "ccs/unknown-prop: Tag has no prop \"kind\" and doesn't pass attributes through, so it's ignored.",
    ]);
  });

  test("events and binds are checked", () => {
    expect(
      run(
        "<TextInput on:keyup={() => {}} on:chnage={() => {}} bind:vlaue={v} bind:value={v} />",
      ),
    ).toEqual([
      'ccs/unknown-event: TextInput never dispatches or forwards "keyup", so this handler won\'t run.',
      'ccs/unknown-event: TextInput never dispatches or forwards "chnage", so this handler won\'t run. Did you mean "on:change"?',
      'ccs/unknown-prop: TextInput has no prop "vlaue" to bind. Did you mean "value"?',
    ]);
  });

  test("family children outside their provider are reported", () => {
    expect(run(`<Tab label="One" />`)).toEqual([
      'ccs/missing-parent: Tab must be inside Tabs; it reads the "carbon:Tabs" context and throws without one.',
    ]);
    expect(run(`<Tabs>{#if true}<Tab label="One" />{/if}</Tabs>`)).toEqual([]);
  });

  test("outside the entry file, a missing parent is only reported if the provider is imported here", () => {
    const local = (markup: string) =>
      lint(
        `<script>\n  import { Tab } from "carbon-components-svelte";\n</script>\n${markup}`,
        "Item.svelte",
        {
          api,
          parse,
          isEntry: false,
        },
      );
    expect(local(`<Tab label="Composed" />`)).toEqual([]);
  });
});
