<script>
  import { Button } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  const kinds = ["primary", "ghost", "danger-ghost"];
  const sizes = ["xs", "small", "field", "default", "lg", "xl"];

  let loading = false;
</script>

<!--
  Each kind at each size, with and without an icon, all driven by one flag so
  a test can measure every width before and after `loading` turns on.
-->
<button
  type="button"
  data-testid="start-loading"
  on:click={() => (loading = true)}
>
  Start loading
</button>

{#each kinds as kind}
  {#each sizes as size}
    <div>
      <Button {kind} {size} {loading} data-testid="{kind}-{size}-text">
        Save
      </Button>
      <Button
        {kind}
        {size}
        {loading}
        icon={Add}
        data-testid="{kind}-{size}-icon"
      >
        Save
      </Button>
    </div>
  {/each}
{/each}
