import { describe, expect, test } from "bun:test";
import { compile } from "svelte/compiler";
import { formatArgs, sanitizeStyle } from "../sandbox/inspect/format.js";
import {
  createRemote,
  describe as describeValue,
} from "../sandbox/inspect/remote.js";
import {
  decodeMappings,
  originalPosition,
  parseStack,
} from "../sandbox/inspect/sourcemap.js";

describe("remote previews", () => {
  test("primitives are inline, objects get a handle and a one-line description", () => {
    const r = createRemote();
    expect(r.preview("hi")).toEqual({ t: "string", v: "hi" });
    expect(r.preview(-0)).toEqual({ t: "number", v: "-0" });
    expect(r.preview(10n)).toEqual({ t: "bigint", v: "10n" });
    expect(r.preview(undefined)).toEqual({ t: "undefined" });
    const p = r.preview({ a: 1, b: "x", c: [1, 2] });
    expect(p).toMatchObject({ t: "object", sub: "object", cls: "Object" });
    expect((p as { desc: string }).desc).toBe('{a: 1, b: "x", c: Array(2)}');
    expect(describeValue(new Map([["k", 1]]), "map", 1)).toBe(
      'Map(1) {"k" => 1}',
    );
  });

  test("properties expand one level, chunk long arrays and defer getters", () => {
    const r = createRemote();
    const obj = {
      n: 1,
      get lazy() {
        throw new Error("not called");
      },
    };
    const { id } = r.preview(obj) as { id: number };
    const { props } = r.properties(id);
    expect(props.map((p: { name: string }) => p.name)).toEqual(["n", "lazy"]);
    expect(props[1]).toMatchObject({ getter: true });
    expect(r.invokeGetter(id, "lazy")).toMatchObject({ threw: true });

    const big = r.preview(Array.from({ length: 250 }, (_, i) => i)) as {
      id: number;
    };
    const groups = r.properties(big.id).props;
    expect(groups.map((p: { name: string }) => p.name)).toEqual([
      "[0 … 99]",
      "[100 … 199]",
      "[200 … 249]",
    ]);
    expect(
      r
        .properties(big.id, [200, 202])
        .props.map((p: { value: { v: string } }) => p.value.v),
    ).toEqual(["200", "201", "202"]);
  });

  test("json marks cycles; cleared handles report gone", () => {
    const r = createRemote();
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    const { id } = r.preview(a) as { id: number };
    expect(JSON.parse(r.json(id).text as string)).toEqual({
      x: 1,
      self: "[Circular]",
    });
    r.clear();
    expect(r.properties(id)).toEqual({ gone: true, props: [] });
  });
});

describe("format specifiers", () => {
  const preview = (v: unknown) => ({ preview: v });

  test("%s %d %f %o substitute and leave the rest", () => {
    const { parts, rest } = formatArgs(
      ["%s is %d (%f) %o!", "x", "42.9px", "1.5", { a: 1 }, "extra"],
      preview,
    );
    expect(parts).toEqual([
      { text: "x" },
      { text: " is " },
      { text: "42" },
      { text: " (" },
      { text: "1.5" },
      { text: ") " },
      { value: { preview: { a: 1 } } },
      { text: "!" },
    ]);
    expect(rest).toEqual(["extra"]);
  });

  test("%c styles following text with sanitized CSS", () => {
    const { parts } = formatArgs(
      ["%cbig%c plain", "color: red; position: fixed; background: url(x)", ""],
      preview,
    );
    expect(parts).toEqual([
      { text: "big", style: "color: red" },
      { text: " plain" },
    ]);
    expect(sanitizeStyle("font-weight: bold; top: 0")).toBe(
      "font-weight: bold",
    );
  });

  test("no specifier means no parts", () => {
    expect(formatArgs(["plain", 1], preview)).toEqual({
      parts: null,
      rest: ["plain", 1],
    });
  });
});

describe("source maps and stacks", () => {
  test("maps a compiled Svelte line back to its source line", () => {
    const source =
      '<script>\n  let n = 0;\n  console.log("marker", n);\n</script>\n\n<p>{n}</p>\n';
    const { js } = compile(source, {
      filename: "App.svelte",
      generate: "client",
      dev: false,
    });
    const lines = decodeMappings(js.map.mappings);
    const generated = js.code.split("\n");
    const row = generated.findIndex((l) => l.includes('"marker"'));
    const column = generated[row].indexOf("console") + 1;
    expect(
      originalPosition(lines, js.map.sources, row + 1, column),
    ).toMatchObject({ line: 3 });
  });

  test("parses Chrome and Firefox/Safari frames", () => {
    const chrome =
      "Error\n    at log (http://x/sandbox/inspect/console.js:10:3)\n    at App (blob:null/1a2b:12:7)\n    at blob:null/1a2b:20:1";
    expect(
      parseStack(chrome).map((f) => [f.fn, f.url, f.line, f.column]),
    ).toEqual([
      ["log", "http://x/sandbox/inspect/console.js", 10, 3],
      ["App", "blob:null/1a2b", 12, 7],
      ["", "blob:null/1a2b", 20, 1],
    ]);
    const firefox =
      "log@http://x/console.js:10:3\nApp@blob:null/1a2b:12:7\n@blob:null/1a2b:20:1";
    expect(parseStack(firefox).map((f) => [f.fn, f.line])).toEqual([
      ["log", 10],
      ["App", 12],
      ["", 20],
    ]);
  });
});
