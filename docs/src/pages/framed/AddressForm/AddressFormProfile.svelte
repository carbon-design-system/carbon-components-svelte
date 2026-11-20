<script>
  import {
    AddressForm,
    Button,
    ButtonSet,
    formatAddress,
    normalizeAddress,
    Stack,
    validateAddress,
  } from "carbon-components-svelte";

  let saved = normalizeAddress({
    country: "DE",
    lines: ["Heidestraße 17"],
    locality: "Köln",
    postalCode: "51147",
  });
  let draft = saved;
  let editing = false;

  function edit() {
    draft = { ...saved };
    editing = true;
  }

  function save() {
    const next = normalizeAddress(draft);
    if (!validateAddress(next).valid) return;
    saved = next;
    editing = false;
  }
</script>

<Stack gap={6}>
  {#if editing}
    <AddressForm bind:value={draft} legendText="Home address" />
    <ButtonSet>
      <Button kind="secondary" on:click={() => (editing = false)}>Cancel</Button
      >
      <Button on:click={save}>Save</Button>
    </ButtonSet>
  {:else}
    <address>
      {#each formatAddress(saved) as line}
        {line}<br />
      {/each}
    </address>
    <Button kind="tertiary" size="sm" on:click={edit}>Edit address</Button>
  {/if}
</Stack>
