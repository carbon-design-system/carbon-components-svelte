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

describe("console flood", () => {
  test("admits 2,000 per second and reports the rest after them", async () => {
    const { installConsole } = await import("../sandbox/inspect/console.js");
    const posted: { type: string; entries?: unknown[]; count?: number }[] = [];
    const queue: (() => void)[] = [];
    const saved = { ...console };
    installConsole({
      remote: createRemote(),
      post: (m: (typeof posted)[number]) => posted.push(m),
      schedule: (fn: () => void) => queue.push(fn),
      modules: new Map(),
    });
    try {
      for (let i = 0; i < 5000; i++) console.log("row", i);
    } finally {
      Object.assign(console, saved);
    }
    while (queue.length) queue.shift()?.();
    const logged = posted
      .filter((m) => m.type === "logs")
      .reduce((n, m) => n + (m.entries?.length ?? 0), 0);
    expect(logged).toBe(2000);
    expect(posted.at(-1)).toEqual({ type: "logs-dropped", count: 3000 });
  });
});

describe("Svelte-aware previews", () => {
  test("$state proxies get a badge and preview their snapshot", () => {
    const STATE = Symbol("$state");
    const target = { count: 2 };
    const proxy = new Proxy(target, {
      has: (t, k) => k === STATE || k in t,
    });
    const r = createRemote({
      stateSymbol: STATE,
      snapshot: (v) => ({ ...(v as object) }),
    });
    expect(r.preview(proxy)).toMatchObject({
      badge: "$state",
      desc: "{count: 2}",
    });
    expect(r.preview({ count: 2 })).not.toHaveProperty("badge");
  });

  test("stores preview their current value and expand to $value", async () => {
    const { writable } = await import("svelte/store");
    const store = writable({ open: true });
    const r = createRemote();
    const p = r.preview(store) as { id: number; badge: string; desc: string };
    expect(p).toMatchObject({
      badge: "store",
      sub: "store",
      desc: "{open: true}",
    });
    expect(r.properties(p.id).props[0]).toMatchObject({ name: "$value" });
  });
});

describe("side-effect origin", () => {
  test("classifies REPL, library and Svelte frames, skipping the sandbox", async () => {
    const { classifyStack } = await import("../sandbox/inspect/origin.js");
    const at = (url: string) =>
      `Error\n    at window.addEventListener (http://x/sandbox/sandbox.js:1:1)\n    at fn (${url}:3:4)`;
    expect(classifyStack(at("blob:null/abc"))).toEqual({ kind: "user" });
    expect(
      classifyStack(
        at(
          "http://x/pkg/ccs@local/svelte@5.57.1/src/utils/window-listener-pool.js",
        ),
      ),
    ).toEqual({
      kind: "library",
      file: "src/utils/window-listener-pool.js",
    });
    expect(
      classifyStack(at("http://x/pkg/svelte@5.57.1/chunk-abc.js")),
    ).toEqual({ kind: "svelte" });
  });
});

describe("color and contrast", () => {
  test("parses hex and rgb() colors", async () => {
    const { parseColor, colorKey } = await import(
      "../sandbox/inspect/tokens.js"
    );
    expect(parseColor("#0f62fe")).toEqual([15, 98, 254, 1]);
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
    expect(parseColor("rgba(0, 0, 0, 0.5)")).toEqual([0, 0, 0, 0.5]);
    expect(parseColor("rgb(22 22 22 / 50%)")).toEqual([22, 22, 22, 0.5]);
    expect(colorKey("#161616")).toBe(colorKey("rgb(22, 22, 22)"));
    expect(colorKey("transparent")).toBeNull();
  });

  test("WCAG contrast and large text", async () => {
    const { contrastRatio, isLargeText } = await import(
      "../sandbox/inspect/tokens.js"
    );
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
    // Carbon gray 30 on white fails 4.5:1.
    expect(contrastRatio([198, 198, 198], [255, 255, 255])).toBeLessThan(4.5);
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(19, 700)).toBe(true);
    expect(isLargeText(16, 700)).toBe(false);
  });
});

describe("performance channel", () => {
  test("positionAt maps a character offset to line and column", async () => {
    const { positionAt } = await import("../sandbox/inspect/perf.js");
    expect(positionAt("ab\ncd\nef", 0)).toEqual({ line: 1, column: 1 });
    expect(positionAt("ab\ncd\nef", 4)).toEqual({ line: 2, column: 2 });
  });

  test("interactions are named by the event that did the work and count DOM changes", async () => {
    const { summarizeInteractions } = await import(
      "../sandbox/inspect/perf.js"
    );
    const e = (
      name: string,
      id: number,
      start: number,
      duration: number,
      processing: number,
    ) =>
      ({
        name,
        interactionId: id,
        startTime: start,
        duration,
        processingStart: start + 2,
        processingEnd: start + 2 + processing,
        target: null,
      }) as unknown as PerformanceEventTiming;
    const rows = summarizeInteractions(
      [
        e("pointerdown", 1, 100, 120, 1),
        e("click", 1, 104, 116, 180),
        e("keydown", 0, 300, 50, 5),
      ],
      [
        [150, 30],
        [210, 5],
        [400, 99],
      ],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "click",
      duration: 120,
      inputDelay: 2,
      processing: 181,
      mutations: 35,
    });
  });

  test("profile samples attribute a window to the innermost REPL frame", async () => {
    const { attributeSamples, frameSource } = await import(
      "../sandbox/inspect/perf.js"
    );
    const modules = new Map([["blob:null/1", { name: "App.svelte" }]]);
    const trace = {
      resources: [
        "http://x/pkg/svelte@5.57.1/chunk.js",
        "blob:null/1",
        "http://x/pkg/ccs@local/svelte@5.57.1/src/DataTable/DataTable.svelte",
      ],
      frames: [
        { name: "run", resourceId: 0, line: 1, column: 1 },
        { name: "block", resourceId: 1, line: 12, column: 3 },
        { name: "sort", resourceId: 2, line: 40, column: 1 },
      ],
      stacks: [
        { frameId: 0 },
        { frameId: 1, parentId: 0 },
        { frameId: 2, parentId: 0 },
      ],
      samples: [
        { timestamp: 10, stackId: 1 },
        { timestamp: 20, stackId: 1 },
        { timestamp: 30, stackId: 2 },
        { timestamp: 99, stackId: 1 },
      ],
    };
    const top = attributeSamples(trace, 0, 50, modules);
    expect(
      top.map((t) => [t.source.file, t.source.line ?? null, t.samples]),
    ).toEqual([
      ["App.svelte", 12, 2],
      ["src/DataTable/DataTable.svelte", null, 1],
    ]);
    expect(
      frameSource("http://x/pkg/svelte@5.57.1/chunk.js", 1, 1, modules).kind,
    ).toBe("svelte");
  });
});
