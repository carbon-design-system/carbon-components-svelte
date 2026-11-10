<script lang="ts">
  import ErrorBoundary from "carbon-components-svelte/ErrorBoundary/ErrorBoundary.svelte";
  import Thrower from "../ErrorBoundary/Thrower.test.svelte";

  let { control }: { control: { fail: unknown } } = $props();
</script>

<ErrorBoundary>
  <Thrower {control} />
  {#snippet failed({ error, reset }: { error: unknown; reset: () => void })}
    <div data-testid="snippet">
      Snippet: {error instanceof Error ? error.message : "unknown"}
      <button type="button" onclick={reset}>Reload</button>
    </div>
  {/snippet}
</ErrorBoundary>
