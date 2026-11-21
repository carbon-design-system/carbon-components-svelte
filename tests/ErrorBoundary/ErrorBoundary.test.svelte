<script lang="ts">
  import ErrorBoundary from "carbon-components-svelte/ErrorBoundary/ErrorBoundary.svelte";
  import Thrower from "./Thrower.test.svelte";

  export let control: { fail: unknown } = { fail: false };
  export let custom = false;
  export let onerror: (event: CustomEvent) => void = () => {};
</script>

{#if custom}
  <ErrorBoundary on:error={onerror} {...$$restProps}>
    <Thrower {control} />
    <svelte:fragment slot="failed" let:error let:reset>
      <div data-testid="custom">
        Custom: {error instanceof Error ? error.message : "unknown"}
        <button type="button" on:click={reset}>Reload</button>
      </div>
    </svelte:fragment>
  </ErrorBoundary>
{:else}
  <ErrorBoundary on:error={onerror} {...$$restProps}>
    <Thrower {control} />
  </ErrorBoundary>
{/if}
