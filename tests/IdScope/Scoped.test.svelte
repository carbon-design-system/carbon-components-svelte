<script lang="ts">
  import { createIdScope } from "carbon-components-svelte/utils/id-scope.js";
  import type { ComponentType, SvelteComponent } from "svelte";

  /** The app root: every component below it takes its ids from this scope. */
  export let component: ComponentType<SvelteComponent>;
  export let props: Record<string, unknown> = {};
  export let prefix = "app";

  createIdScope(prefix);
</script>

<svelte:component this={component} {...props} />
