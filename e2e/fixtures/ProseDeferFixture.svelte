<script>
  import "carbon-components-svelte/css/prose.css";
  import Prose from "carbon-components-svelte/Prose/Prose.svelte";

  // Code blocks of many lengths, so a reserved height that ignores the
  // line count is wrong for most of them.
  const counts = [1, 3, 8, 2, 20, 5, 13, 1, 34, 4, 9, 2, 16, 6, 27, 3, 11, 1];
  const codeOf = (lines) =>
    Array.from(
      { length: lines },
      (_, i) => `const line${i + 1} = ${i + 1};`,
    ).join("\n");
</script>

<div style="padding: 2rem">
  <Prose deferOffscreen data-testid="prose">
    <h1>Deferred code blocks</h1>
    {#each counts as lines, i (i)}
      <p>Block {i + 1} has {lines} lines.</p>
      <pre data-testid="pre-{i}"><code>{codeOf(lines)}</code></pre>
    {/each}
  </Prose>
</div>
