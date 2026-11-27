<script>
  import { CodeSnippet } from "carbon-components-svelte";

  const code = `import { Button } from "carbon-components-svelte";

export function save(items) {
  const total = items.length;
  return total > 0 ? total : null;
}`;
</script>

<CodeSnippet type="multi" {code} lineNumbers highlightLines="3,5-6" />
