<script>
  import { Button, TextInput, trapFocus } from "carbon-components-svelte";

  let open = false;
  let container;

  function handleKeydown(event) {
    if (event.key === "Tab") trapFocus({ container, event });
    if (event.key === "Escape") open = false;
  }
</script>

<Button on:click={() => (open = true)}>Invite teammate</Button>

{#if open}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    bind:this={container}
    role="dialog"
    aria-label="Invite teammate"
    tabindex="-1"
    on:keydown={handleKeydown}
    style="margin-top: var(--cds-spacing-05); padding: var(--cds-spacing-05); max-width: 20rem; background: var(--cds-layer)"
  >
    <TextInput labelText="Email" placeholder="ada@acme-corp.com" />
    <div
      style="display: flex; gap: var(--cds-spacing-03); margin-top: var(--cds-spacing-05)"
    >
      <Button size="small" on:click={() => (open = false)}>Send invite</Button>
      <Button size="small" kind="ghost" on:click={() => (open = false)}>
        Cancel
      </Button>
    </div>
  </div>
{/if}
