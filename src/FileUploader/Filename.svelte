<script>
  export let iconDescription = "";
  export let invalid = false;
  export let status = "uploading"; // "uploading" | "edit" | "complete"

  import Close16 from "carbon-icons-svelte/lib/Close16";
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";
  import { Loading } from "../Loading";
</script>

{#if status === 'uploading'}
  <Loading
    description={iconDescription}
    {...$$restProps}
    small
    withOverlay={false} />
{/if}

{#if status === 'edit'}
  {#if invalid}
    <WarningFilled16 class="bx--file-invalid" />
  {/if}
  <Close16
    aria-label={iconDescription}
    title={iconDescription}
    class="bx--file-close"
    {...$$restProps}
    on:click
    on:keydown />
{/if}

{#if status === 'complete'}
  <CheckmarkFilled16
    aria-label={iconDescription}
    title={iconDescription}
    class="bx--file-complete"
    {...$$restProps} />
{/if}
