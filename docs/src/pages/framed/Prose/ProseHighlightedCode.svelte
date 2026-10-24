<script>
  import { Prose } from "carbon-components-svelte";
  import { highlight } from "carbon-components-svelte/syntax";

  const code = `const response = await fetch("/v1/usage", {
  headers: { Authorization: \`Bearer \${key}\` },
});
// Usage is paginated at 100 records.
const { data, next } = await response.json();`;
</script>

<Prose>
  <p>Read the usage for the current key:</p>
  <pre><code>{@html highlight(code, "js")}</code></pre>
</Prose>
