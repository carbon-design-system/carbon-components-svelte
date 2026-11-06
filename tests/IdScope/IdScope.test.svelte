<script lang="ts">
  import {
    createIdScope,
    useId,
  } from "carbon-components-svelte/utils/id-scope.js";
  import IdProbe from "./IdProbe.test.svelte";

  /** Start a scope with this prefix, or none when `undefined`. */
  export let prefix: string | undefined = undefined;
  /** Name for a generated prefix, when `prefix` is empty. */
  export let name: string | undefined = undefined;
  export let scoped = true;
  export let nested = false;

  const base = scoped ? createIdScope(prefix, name) : "";

  /** An id made after init, such as in an event handler. */
  let late = "";
</script>

<span data-testid="base">{base}</span>
<IdProbe name="a" />
<IdProbe name="a" />
<IdProbe name="b" />
<IdProbe />
<IdProbe name="legacy" fallbackPrefix="legacy-prefix" />
{#if nested}
  <svelte:self prefix="inner" scoped nested={false} />
{/if}
<button type="button" on:click={() => (late = useId("late"))}>late</button>
<output data-testid="late">{late}</output>
