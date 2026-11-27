<script>
  import { CodeSnippet, MergeResolver, Stack } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  const base = `# checkout service
service:
  replicas: 2
  image: registry.example.com/checkout:1.4.0
  resources:
    memory: 512Mi
  env:
    LOG_LEVEL: info
    PAYMENT_TIMEOUT: 30s
autoscaling:
  enabled: false
  maxReplicas: 4
`;

  const ours = `# checkout service
service:
  replicas: 4
  image: registry.example.com/checkout:1.4.0
  resources:
    memory: 1Gi
  env:
    LOG_LEVEL: debug
    PAYMENT_TIMEOUT: 45s
autoscaling:
  enabled: true
  maxReplicas: 8
`;

  const theirs = `# checkout service
service:
  replicas: 3
  image: registry.example.com/checkout:1.5.0
  resources:
    memory: 512Mi
  env:
    LOG_LEVEL: warn
    PAYMENT_TIMEOUT: 60s
autoscaling:
  enabled: false
  maxReplicas: 4
`;

  // `tokenize` has no YAML, so wrap it with a small tokenizer for the one
  // language this example needs.
  function tokenizeYaml(code, language) {
    if (language !== "yaml") return tokenize(code, language);
    const pattern =
      /(#.*)|^(\s*-?\s*)([\w.-]+)(:)|("[^"\n]*"|'[^'\n]*')|\b(true|false|null)\b|\b(\d+[a-zA-Z]*)\b|\s+|\S+/gm;
    const tokens = [];
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

  let merged = "";
</script>

<Stack gap={5}>
  <MergeResolver
    {base}
    {ours}
    {theirs}
    language="yaml"
    tokenize={tokenizeYaml}
    oursLabel="Ours (main)"
    theirsLabel="Theirs (release/1.5)"
    on:resolve={(e) => (merged = e.detail.text)}
  />
  {#if merged}
    <CodeSnippet type="multi" code={merged} />
  {/if}
</Stack>
