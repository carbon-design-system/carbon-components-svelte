<script>
  import { JsonViewer } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const dataset = params.get("data") ?? "basic";
  const count = Number(params.get("n") ?? 1000);
  const depth = Number(params.get("depth") ?? 200);

  /** Each user is 10 nodes: the object, its fields, and two nested objects. */
  function users(n) {
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      name: `user-${i}`,
      active: i % 2 === 0,
      tags: ["alpha", "beta"],
      geo: { lat: i * 0.5, lng: -i * 0.25 },
    }));
  }

  /** About `n * 500` bytes of JSON text, parsed here as the consumer would. */
  function payload(n) {
    const bio =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(6);
    let text = "[";
    for (let i = 0; i < n; i++) {
      if (i > 0) text += ",";
      text += JSON.stringify({
        id: i,
        name: `user-${i}`,
        active: i % 2 === 0,
        bio: `${bio}${i}`,
        tags: ["alpha", "beta"],
        geo: { lat: i * 0.5, lng: -i * 0.25 },
      });
    }
    text += "]";
    const start = performance.now();
    const parsed = JSON.parse(text);
    window.__payload = {
      bytes: text.length,
      parseMs: performance.now() - start,
    };
    return parsed;
  }

  function nested(levels) {
    const root = { level: 0 };
    let node = root;
    for (let i = 1; i <= levels; i++) {
      node.child = { level: i };
      node = node.child;
    }
    node.leaf = "bottom";
    return root;
  }

  function types() {
    const value = {
      string: "Hello, world",
      long: "The quick brown fox jumps over the lazy dog. ".repeat(8),
      number: 42,
      float: 2.5,
      negativeZero: -0,
      nan: Number.NaN,
      boolean: true,
      null: null,
      undefined: undefined,
      bigint: 9007199254740993n,
      date: new Date("2024-05-01T12:30:00Z"),
      invalidDate: new Date("nope"),
      regexp: /ab+c/gi,
      symbol: Symbol("id"),
      fn: function greet() {},
      map: new Map([
        ["one", 1],
        ["two", 2],
      ]),
      set: new Set(["a", "b"]),
      error: new TypeError("Something broke"),
      list: [1, "two", { three: 3 }, [4]],
      empty: {},
      emptyList: [],
      "key with spaces": "quoted in paths",
      "a-b": "hyphen",
    };
    value.self = value;
    return value;
  }

  const datasets = {
    basic: () => ({
      name: "carbon-components-svelte",
      version: "0.1.0",
      private: false,
      license: null,
      keywords: ["svelte", "carbon", "components"],
      repository: {
        type: "git",
        url: "https://github.com/carbon-design-system",
      },
      scripts: { build: "vite build", test: "vitest" },
      matrix: [
        [1, 2],
        [3, 4],
      ],
    }),
    types,
    users: () => users(count),
    big: () => users(count),
    payload: () => payload(count),
    deep: () => nested(depth),
    primitive: () => 42,
  };

  const value = datasets[dataset]();
  /** @type {any} */
  let viewer;
  let path = "";
  /** @type {Array<[string, string]>} */
  const events = [];

  if (typeof window !== "undefined") {
    window.__value = value;
    window.__events = events;
    Object.defineProperty(window, "__viewer", {
      get: () => viewer,
      configurable: true,
    });
  }
</script>

<JsonViewer
  bind:this={viewer}
  bind:path
  {value}
  height={Number(params.get("height") ?? 400)}
  size={params.get("size") ?? "xs"}
  expandDepth={Number(params.get("expand") ?? 1)}
  labelText="JSON"
  query={params.get("q") ?? ""}
  showTypes={params.has("types")}
  searchShortcut={params.get("shortcut") ?? ""}
  on:select={(event) => events.push(["select", event.detail.path])}
  on:copy={(event) => events.push(["copy", event.detail.kind])}
  data-testid="json-viewer"
/>
<p data-testid="path">{path}</p>
