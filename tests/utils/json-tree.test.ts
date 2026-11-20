import {
  keyText,
  searchKeyText,
  serializeValue,
  splitMatches,
  stringWindow,
  valueText,
} from "../../src/utils/json-format.js";
import {
  findByKeys,
  formatPath,
  pathSegments,
} from "../../src/utils/json-path.js";
import {
  buildRows,
  clearSearch,
  createWalk,
  revealAncestors,
  toggleRows,
} from "../../src/utils/json-tree-walk.js";
import {
  ARRAY,
  CHUNK,
  CIRCULAR,
  DATE,
  FLAG_EXPANDED,
  JsonTree,
  LONG_STRING,
  MAP,
  OBJECT,
  SET,
} from "../../src/utils/json-tree.js";

/** Run a walk to the end and return it. */
function finish(walk: ReturnType<typeof createWalk>) {
  while (!walk.step(1000));
  return walk;
}

function expandAll(tree: JsonTree) {
  finish(createWalk(tree, { expand: true }));
}

/** The node reached by a path of keys. */
function at(tree: JsonTree, ...keys: Array<string | number>) {
  const id = findByKeys(tree, keys);
  expect(id).toBeGreaterThanOrEqual(0);
  return id;
}

describe("JsonTree", () => {
  it("classifies JSON and non-JSON values", () => {
    const tree = new JsonTree({
      date: new Date(0),
      map: new Map([["a", 1]]),
      set: new Set([1]),
      list: [1],
      long: "x".repeat(101),
    });

    expect(tree.kinds[0]).toBe(OBJECT);
    expect(tree.kinds[at(tree, "date")]).toBe(DATE);
    expect(tree.kinds[at(tree, "map")]).toBe(MAP);
    expect(tree.kinds[at(tree, "set")]).toBe(SET);
    expect(tree.kinds[at(tree, "list")]).toBe(ARRAY);
    expect(tree.kinds[at(tree, "long")]).toBe(LONG_STRING);
  });

  it("creates children only when they are read", () => {
    const tree = new JsonTree({ a: { b: { c: 1 } } });

    expect(tree.length).toBe(1);
    tree.materialize(0);
    expect(tree.length).toBe(2);
    expect(tree.childCount(1)).toBe(1);
    expect(tree.length).toBe(2);
  });

  it("shows a reference to an ancestor as a circular leaf, not a subtree", () => {
    const value: Record<string, unknown> = { name: "root", list: [] };
    (value.list as unknown[]).push(value);
    const tree = new JsonTree(value);
    expandAll(tree);

    const ref = at(tree, "list", 0);
    expect(tree.kinds[ref]).toBe(CIRCULAR);
    expect(tree.canExpand(ref)).toBe(false);
    expect(valueText(tree, ref).text).toBe("[Circular → $]");
  });

  it("repeats an object that is shared but not circular", () => {
    const shared = { n: 1 };
    const tree = new JsonTree({ a: shared, b: shared });
    expandAll(tree);

    expect(tree.kinds[at(tree, "a")]).toBe(OBJECT);
    expect(tree.kinds[at(tree, "b")]).toBe(OBJECT);
  });

  it("shows a property whose getter throws", () => {
    const value = {
      get boom(): string {
        throw new Error("nope");
      },
    };
    const tree = new JsonTree(value);
    tree.materialize(0);

    expect(valueText(tree, at(tree, "boom")).text).toBe("[Throws: nope]");
  });

  it("splits a long string into chunks that rebuild it", () => {
    const text = "abcdefghij".repeat(25);
    const tree = new JsonTree({ text }, { maxStringLength: 100 });
    const node = at(tree, "text");

    expect(tree.canExpand(node)).toBe(true);
    tree.setExpanded(node, true);
    const first = tree.materialize(node);

    expect(tree.kinds[first]).toBe(CHUNK);
    expect(tree.childCount(node)).toBe(3);
    expect([0, 1, 2].map((i) => tree.chunkText(first + i)).join("")).toBe(text);
  });
});

describe("rows", () => {
  const value = { a: { b: [1, 2] }, c: 3 };

  it("lists the root and its expanded descendants in order", () => {
    const tree = new JsonTree(value);
    tree.setExpanded(0, true);

    expect(buildRows(tree).map((id) => keyText(tree, id).text)).toEqual([
      "$",
      "a",
      "c",
    ]);
  });

  it("splices a subtree in and out without touching the rest", () => {
    const tree = new JsonTree(value);
    tree.setExpanded(0, true);
    let rows = buildRows(tree);
    const a = rows[1];

    rows = toggleRows(tree, rows, 1, true);
    expect(rows.map((id) => keyText(tree, id).text)).toEqual([
      "$",
      "a",
      "b",
      "c",
    ]);

    rows = toggleRows(tree, rows, 1, false);
    expect(rows).toEqual(buildRows(tree));
    expect(tree.isExpanded(a)).toBe(false);
  });

  it("restores a collapsed subtree's own expansion when it opens again", () => {
    const tree = new JsonTree(value);
    expandAll(tree);
    let rows = buildRows(tree);
    expect(rows).toHaveLength(6);

    rows = toggleRows(tree, rows, 1, false);
    expect(rows).toHaveLength(3);
    rows = toggleRows(tree, rows, 1, true);
    expect(rows).toHaveLength(6);
  });
});

describe("walk", () => {
  it("expands to a depth", () => {
    const tree = new JsonTree({ a: { b: { c: 1 } } });
    finish(createWalk(tree, { expand: true, maxDepth: 2 }));

    expect(buildRows(tree)).toHaveLength(3);
    expect(tree.isExpanded(at(tree, "a"))).toBe(true);
    expect(tree.isExpanded(at(tree, "a", "b"))).toBe(false);
  });

  it("stops creating nodes at the limit", () => {
    // Each level holds the level below twice, so an unbounded walk makes 2^20.
    let level: unknown = { leaf: true };
    for (let i = 0; i < 20; i++) level = { x: level, y: level };
    const tree = new JsonTree(level);
    const walk = finish(createWalk(tree, { expand: true, limit: 5000 }));

    expect(walk.limited).toBe(true);
    expect(tree.length).toBeLessThan(5100);
  });

  it("resumes where a time slice stopped", () => {
    const tree = new JsonTree(Array.from({ length: 2000 }, (_, i) => ({ i })));
    const walk = createWalk(tree, { expand: true });
    let slices = 1;
    while (!walk.step(0)) slices++;

    expect(slices).toBeGreaterThan(1);
    expect(tree.length).toBe(4001);
  });

  it("finds matches in document order, in keys and values", () => {
    const tree = new JsonTree({
      name: "ada",
      list: [{ id: "x-ada" }, 3],
      ada: true,
    });
    const walk = finish(createWalk(tree, { query: "ADA" }));

    expect(
      walk.matches.map((id) => formatPath(pathSegments(tree, id))),
    ).toEqual(["$.name", "$.list[0].id", "$.ada"]);
  });

  it("does not match an array index as a key", () => {
    const tree = new JsonTree(["a", "b", "c", "d"]);
    const walk = finish(createWalk(tree, { query: "3" }));

    expect(walk.matches).toEqual([]);
    expect(searchKeyText(tree, tree.childAt(0, 3))).toBe("");
  });

  it("caps the matches it keeps", () => {
    const tree = new JsonTree(Array.from({ length: 50 }, () => "hit"));
    const walk = finish(createWalk(tree, { query: "hit", maxMatches: 10 }));

    expect(walk.matches).toHaveLength(10);
    expect(walk.truncated).toBe(true);
  });

  it("opens the ancestors of the matches, and closes only those", () => {
    const tree = new JsonTree({ a: { b: { c: "needle" } }, d: { e: 1 } });
    tree.setExpanded(0, true);
    const walk = finish(createWalk(tree, { query: "needle" }));
    const opened = revealAncestors(tree, walk.matches);

    expect(opened).toHaveLength(2);
    expect(buildRows(tree)).toHaveLength(5);

    clearSearch(tree, walk.matches, opened);
    expect(buildRows(tree)).toHaveLength(3);
    expect(tree.flags[walk.matches[0]] & 12).toBe(0);
  });

  it("leaves a node the user opened during a search open", () => {
    const tree = new JsonTree({ a: { b: "needle" } });
    tree.setExpanded(0, true);
    const walk = finish(createWalk(tree, { query: "needle" }));
    const opened = revealAncestors(tree, walk.matches);
    tree.setExpanded(at(tree, "a"), true);

    clearSearch(tree, walk.matches, opened);
    expect(tree.flags[at(tree, "a")] & FLAG_EXPANDED).toBe(FLAG_EXPANDED);
  });
});

describe("paths", () => {
  const tree = new JsonTree({
    users: [{ name: "Ada", "e-mail": "a@x", "it's": 1 }],
    m: new Map<unknown, unknown>([
      ["k", 1],
      [2, 2],
      [{}, 3],
    ]),
    s: new Set(["v"]),
  });
  expandAll(tree);

  it.each([
    [["users", 0, "name"], "$.users[0].name", "data.users[0].name"],
    [["users", 0, "e-mail"], "$.users[0]['e-mail']", 'data.users[0]["e-mail"]'],
    [["users", 0, "it's"], "$.users[0]['it\\'s']", 'data.users[0]["it\'s"]'],
    [["m", "k"], "$.m.k", 'data.m.get("k")'],
    [["m", 2], "$.m[2]", "data.m.get(2)"],
    [["s", 0], "$.s[0]", "[...data.s][0]"],
  ])("writes %j", (keys, jsonpath, js) => {
    const id = at(tree, ...(keys as Array<string | number>));

    expect(formatPath(pathSegments(tree, id))).toBe(jsonpath);
    expect(formatPath(pathSegments(tree, id), "js")).toBe(js);
  });

  it("points at a Map entry by position when its key is an object", () => {
    const id = tree.childAt(at(tree, "m"), 2);

    expect(formatPath(pathSegments(tree, id), "js")).toBe(
      "[...data.m.values()][2]",
    );
  });

  it("writes the root, and a chunk as its string", () => {
    expect(formatPath(pathSegments(tree, 0))).toBe("$");
    expect(formatPath(pathSegments(tree, 0), "js", "root")).toBe("root");

    const long = new JsonTree({ t: "z".repeat(250) });
    const node = at(long, "t");
    long.setExpanded(node, true);
    expect(formatPath(pathSegments(long, long.childAt(node, 1)))).toBe("$.t");
  });

  it("finds nothing for a path that does not exist", () => {
    expect(findByKeys(tree, ["users", 5])).toBe(-1);
    expect(findByKeys(tree, ["nope"])).toBe(-1);
  });
});

describe("format", () => {
  it("writes each type so it reads without color", () => {
    const tree = new JsonTree([
      "s",
      1,
      -0,
      10n,
      null,
      undefined,
      true,
      new Date("2024-01-02T03:04:05Z"),
      new Date("x"),
      /a/g,
      Symbol("q"),
      function f() {},
    ]);
    tree.materialize(0);
    const text = [...Array(12).keys()].map(
      (i) => valueText(tree, tree.childAt(0, i)).text,
    );

    expect(text).toEqual([
      '"s"',
      "1",
      "-0",
      "10n",
      "null",
      "undefined",
      "true",
      "Date 2024-01-02T03:04:05.000Z",
      "Invalid Date",
      "/a/g",
      "Symbol(q)",
      "ƒ f()",
    ]);
  });

  it("summarizes a collapsed container", () => {
    class Point {
      x = 1;
    }
    const tree = new JsonTree({
      o: { a: 1, b: 2 },
      one: { a: 1 },
      empty: {},
      list: [1, 2, 3],
      none: [],
      map: new Map([["a", 1]]),
      set: new Set([1, 2]),
      point: new Point(),
      err: new TypeError("bad\nmore"),
      big: Array.from({ length: 120_000 }),
    });
    const summary = (key: string) => valueText(tree, at(tree, key)).text;

    expect(summary("o")).toBe("{2 keys}");
    expect(summary("one")).toBe("{1 key}");
    expect(summary("empty")).toBe("{}");
    expect(summary("list")).toBe("[3 items]");
    expect(summary("none")).toBe("[]");
    expect(summary("map")).toBe("Map {1 entry}");
    expect(summary("set")).toBe("Set {2 items}");
    expect(summary("point")).toBe("Point {1 key}");
    expect(summary("err")).toBe("TypeError: bad");
    expect(summary("big")).toBe("[120,000 items]");
  });

  it("quotes Map keys that are not strings differently", () => {
    const tree = new JsonTree(
      new Map<unknown, unknown>([
        ["1", "a"],
        [1, "b"],
      ]),
    );
    tree.materialize(0);

    expect(keyText(tree, tree.childAt(0, 0)).text).toBe('"1"');
    expect(keyText(tree, tree.childAt(0, 1)).text).toBe("1");
  });

  it("shows the match in a long string, not its start", () => {
    const text = `${"a".repeat(300)}NEEDLE${"b".repeat(300)}`;
    const view = stringWindow(text, 100, "needle");

    expect(view.before).toBe(true);
    expect(view.body).toContain("NEEDLE");
    expect(stringWindow(text, 100, "").body).toBe("a".repeat(100));
  });

  it("splits text around every match, ignoring case", () => {
    expect(splitMatches("Ada and ada", "ada")).toEqual([
      { text: "Ada", match: true },
      { text: " and ", match: false },
      { text: "ada", match: true },
    ]);
    expect(splitMatches("none", "zz")).toEqual([
      { text: "none", match: false },
    ]);
  });

  it("copies strings raw and containers as JSON a parser accepts", () => {
    const value: Record<string, unknown> = {
      text: "line\n",
      big: 5n,
      when: new Date(0),
      map: new Map([["k", new Set([1])]]),
      err: new RangeError("r"),
    };
    value.self = value;
    const tree = new JsonTree(value);
    tree.materialize(0);

    expect(serializeValue(tree, at(tree, "text"))).toBe("line\n");
    const copied = JSON.parse(serializeValue(tree, 0));
    expect(copied).toMatchObject({
      big: "5n",
      when: "1970-01-01T00:00:00.000Z",
      map: { k: [1] },
      self: "[Circular]",
    });
    expect(copied.err).toMatchObject({ name: "RangeError", message: "r" });
  });
});
