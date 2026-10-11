<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlight } from "carbon-components-svelte/syntax";

  const code = `import { onMount } from "svelte";

// Polls the status endpoint once a minute.
export function poll(url: string, every = 60_000) {
  const timer = setInterval(() => fetch(url), every);
  return { stop: () => clearInterval(timer), url };
}`;
</script>

<CodeSnippet type="multi" {code}>{@html highlight(code, "ts")}</CodeSnippet>
