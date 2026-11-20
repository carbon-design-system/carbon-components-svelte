<script lang="ts">
  import { MergeResolver } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";
  import "carbon-components-svelte/css/syntax-tokens.css";
  import "carbon-components-svelte/css/syntax.css";

  // Flags: ?stress (10,000 lines, 50 conflicts), ?long (20,000 character
  // lines), ?crlf, ?layout=columns|stacked|tabs, ?markers (one conflicted
  // file), ?height=<css length>.
  const params = new URLSearchParams(location.search);
  const stress = params.has("stress");
  const long = params.has("long");
  const crlf = params.has("crlf");
  const layout = (params.get("layout") ?? "auto") as
    "auto" | "columns" | "stacked" | "tabs";
  const height = params.get("height") ?? "26rem";

  const NEWLINE = crlf ? "\r\n" : "\n";

  const SMALL_BASE = `# Service configuration
service:
  name: checkout
  replicas: 2
  image: registry.example.com/checkout:1.4.0
  resources:
    cpu: "500m"
    memory: 512Mi
  env:
    LOG_LEVEL: info
    FEATURE_NEW_CART: false
    PAYMENT_TIMEOUT: 30s
ingress:
  host: checkout.example.com
  tls: true
autoscaling:
  enabled: false
  maxReplicas: 4
`;

  const SMALL_OURS = SMALL_BASE.replace("replicas: 2", "replicas: 4")
    .replace("memory: 512Mi", "memory: 1Gi")
    .replace("LOG_LEVEL: info", "LOG_LEVEL: debug")
    .replace("PAYMENT_TIMEOUT: 30s", "PAYMENT_TIMEOUT: 45s")
    .replace(
      "enabled: false\n  maxReplicas: 4",
      "enabled: true\n  maxReplicas: 8",
    );

  const SMALL_THEIRS = SMALL_BASE.replace("replicas: 2", "replicas: 3")
    .replace("checkout:1.4.0", "checkout:1.5.0")
    .replace("LOG_LEVEL: info", "LOG_LEVEL: warn")
    .replace("PAYMENT_TIMEOUT: 30s", "PAYMENT_TIMEOUT: 60s")
    .replace("tls: true", "tls: true\n  class: nginx");

  function makeLarge() {
    const rows: string[] = [];
    const ours: string[] = [];
    const theirs: string[] = [];
    for (let i = 0; i < 10_000; i++) {
      const filler = long && i % 500 === 7 ? "x".repeat(20_000) : "";
      const line = `key_${i}: value_${i}${filler ? ` # ${filler}` : ""}`;
      rows.push(line);
      ours.push(line);
      theirs.push(line);
    }
    for (let k = 0; k < 50; k++) {
      const at = k * 200 + 10;
      ours[at] = `key_${at}: ours_${k}`;
      theirs[at] = `key_${at}: theirs_${k}`;
      ours[at + 100] = `key_${at + 100}: only_ours_${k}`;
    }
    const join = (list: string[]) => list.join(NEWLINE) + NEWLINE;
    return { base: join(rows), ours: join(ours), theirs: join(theirs) };
  }

  const texts = stress
    ? makeLarge()
    : {
        base: SMALL_BASE.replace(/\n/g, NEWLINE),
        ours: SMALL_OURS.replace(/\n/g, NEWLINE),
        theirs: SMALL_THEIRS.replace(/\n/g, NEWLINE),
      };

  const conflicted = params.has("markers")
    ? `service:\n  replicas: 2\n<<<<<<< HEAD\n  image: app:1.4.0\n=======\n  image: app:1.5.0\n>>>>>>> release\n  tls: true\n`
    : undefined;

  /** A small YAML tokenizer: `tokenize` knows no YAML, so the fixture brings one. */
  function tokenizeYaml(code: string, language: string) {
    if (language !== "yaml") return tokenize(code, language);
    const tokens: Array<{ type: string | null; text: string }> = [];
    const pattern =
      /(#.*)|^(\s*-?\s*)([\w.-]+)(:)|("[^"\n]*"|'[^'\n]*')|\b(true|false|null)\b|\b(\d+[a-zA-Z]*)\b|(\s+)|([^\s]+)/gm;
    for (const match of code.matchAll(pattern)) {
      if (match[1]) tokens.push({ type: "comment", text: match[1] });
      else if (match[3]) {
        tokens.push({ type: null, text: match[2] });
        tokens.push({ type: "property-name", text: match[3] });
        tokens.push({ type: "punctuation", text: match[4] });
      } else if (match[5]) tokens.push({ type: "string", text: match[5] });
      else if (match[6]) tokens.push({ type: "bool", text: match[6] });
      else if (match[7]) tokens.push({ type: "number", text: match[7] });
      else tokens.push({ type: null, text: match[0] });
    }
    return tokens;
  }

  let result = "";
  let resolved = 0;
  let canceled = 0;
  let changes = 0;
</script>

<div data-testid="host">
  <MergeResolver
    data-testid="merge"
    bind:result
    {...conflicted === undefined ? texts : {}}
    {conflicted}
    {layout}
    {height}
    language="yaml"
    tokenize={tokenizeYaml}
    on:change={() => changes++}
    on:resolve={(event) => {
      resolved++;
      if (params.has("cancel")) {
        event.preventDefault();
        canceled++;
      }
    }}
  />
  <p>
    <span data-testid="resolved">{resolved}</span>
    <span data-testid="canceled">{canceled}</span>
    <span data-testid="changes">{changes}</span>
  </p>
  <pre data-testid="result" hidden>{result}</pre>
</div>
