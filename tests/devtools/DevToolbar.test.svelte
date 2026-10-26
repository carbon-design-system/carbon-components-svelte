<svelte:options accessors />

<script lang="ts">
  import { DevToolbar } from "carbon-components-svelte/devtools";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<DevToolbar>;

  export let tools: Props["tools"] = undefined;
  export let expanded: Props["expanded"] = true;
  export let persist: Props["persist"] = false;
  export let persistKey: Props["persistKey"] = "ccs-dev-toolbar-test";
  export let shortcuts: Props["shortcuts"] = true;
  export let mounted = true;
  export let onChange = (_detail: NonNullable<Props["tools"]>) => {};
</script>

<input data-testid="field" />

{#if mounted}
  {#if tools}
    <DevToolbar
      bind:tools
      bind:expanded
      {persist}
      {persistKey}
      {shortcuts}
      on:change={(e) => onChange(e.detail)}
    />
  {:else}
    <DevToolbar
      bind:expanded
      {persist}
      {persistKey}
      {shortcuts}
      on:change={(e) => onChange(e.detail)}
    />
  {/if}
{/if}
