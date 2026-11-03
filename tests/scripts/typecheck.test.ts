// @vitest-environment node
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { emit } from "../../scripts/typecheck/emit";

/** Where `needle` lands in the generated code, mapped back to the source. */
const roundTrip = (source: string, needle: string) => {
  const { out } = emit(source);
  return out.toSource(out.code.indexOf(needle));
};

describe("emit", () => {
  it("maps a markup expression back to its own offset", () => {
    const source = `<script lang="ts">\n  export let item = { text: "" };\n</script>\n\n<span>{item.text}</span>\n`;
    expect(roundTrip(source, "item.text")).toBe(source.indexOf("item.text"));
  });

  it("maps a component's props object to its tag", () => {
    const source = `<script lang="ts">\n  import Button from "./Button.svelte";\n</script>\n\n<Button kind="ghost" />\n`;
    expect(roundTrip(source, "props: {")).toBe(source.indexOf("Button kind"));
  });

  it("drops errors in code it generates", () => {
    const { out } = emit("<script>\n  let a = 1;\n</script>\n");
    expect(out.toSource(out.code.indexOf("__sveltets_2_allPropsType"))).toBe(
      null,
    );
  });

  it("declares a reactive assignment with its value's type", () => {
    const { out } = emit(
      `<script lang="ts">\n  export let a = 1;\n  $: double = a * 2;\n</script>\n`,
    );
    expect(out.code).toContain(
      "let double = __sveltets_2_invalidate(() => (a * 2));",
    );
    // A parent can pass any value, so `a` isn't narrowed to its default.
    expect(out.code).toContain("a = __sveltets_2_any(a);");
  });

  it("checks a repeated event handler in a call of its own", () => {
    const { out } = emit("<button on:click on:click={() => {}}>x</button>\n");
    const calls = out.code.match(/svelteHTML\.createElement\("button"/g);
    expect(calls).toHaveLength(2);
  });

  it("writes `generics` as JSDoc in a JS component", () => {
    const { out } = emit(
      `<script generics="Node extends { id: string } = { id: string }">\n  export let node = undefined;\n</script>\n`,
    );
    expect(out.code).toContain(
      " * @template {{ id: string }} [Node={ id: string }]",
    );
    expect(out.code).not.toContain("$$render<");
  });

  it("types a Svelte 3 component as a class, without a `children` prop", () => {
    const source = `<script>\n  import Box from "./Box.svelte";\n</script>\n\n<Box>x</Box>\n`;
    const svelte3 = emit(source, { svelte: 3 }).out.code;
    expect(svelte3).toContain("__sveltets_2_svelte3_component(");
    expect(svelte3).not.toContain("children:");
    expect(emit(source).out.code).toContain("children:");
  });
});

describe("scripts/typecheck", () => {
  // One planted error per kind, where svelte-check --tsgo reported each,
  // in scripts/typecheck/fixtures. Clean.svelte has none.
  it("reports what svelte-check reports for the fixtures", () => {
    const root = join(import.meta.dirname, "../..");
    const { stdout } = spawnSync(
      "bun",
      [
        "scripts/typecheck/index.ts",
        "--workspace",
        "scripts/typecheck/fixtures",
        "--output",
        "machine",
      ],
      { cwd: root, encoding: "utf-8" },
    );
    const errors = [
      ...stdout.matchAll(/^ERROR "(.+)" (\d+:\d+) .* (TS\d+)$/gm),
    ];
    expect(errors.map(([, file, at, code]) => `${file}:${at} ${code}`)).toEqual(
      [
        "Errors.svelte:8:9 TS2322", // script: a string for a number
        "Errors.svelte:11:8 TS2322", // a component prop's value
        "Errors.svelte:12:45 TS2339", // a dispatched event's detail
        "Errors.svelte:13:33 TS2339", // a default slot's `let:` prop
        "Errors.svelte:14:55 TS2339", // a named slot's `let:` prop
        "Errors.svelte:15:9 TS2322", // an element attribute's value
        "Errors.svelte:16:28 TS2339", // a DOM event
        "Errors.svelte:17:5 TS2304", // an undeclared name in markup
        "Errors.svelte:18:31 TS2339", // an `{#each}` item
        "Errors.svelte:19:18 TS2741", // `bind:this` to another element type
        "Errors.svelte:20:12 TS2339", // a `$store` value
        "render.ts:3:45 TS2322", // a component's props from TypeScript
      ],
    );
  }, 30_000);
});
