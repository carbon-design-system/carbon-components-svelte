<script>
  import {
    Button,
    createOverlay,
    Modal,
    Stack,
  } from "carbon-components-svelte";

  let modalOpen = false;
  let open = false;
  let card;
  let trigger;

  // The card is a layer while it shows. Escape reaches it when it is the top
  // layer, a click on the modal closes only the card, and focus goes back to
  // the trigger if it was inside the card.
  const layer = createOverlay({
    kind: "info-card",
    element: () => card,
    anchors: () => [trigger],
    returnFocus: true,
    onDismiss: () => {
      open = false;
    },
  });

  $: layer.sync(open);
</script>

<Button on:click={() => (modalOpen = true)}>Open modal</Button>

<Modal bind:open={modalOpen} passiveModal modalHeading="A custom layer">
  <Stack gap={5}>
    <Button kind="tertiary" bind:ref={trigger} on:click={() => (open = !open)}>
      Show details
    </Button>
    {#if open}
      <div bind:this={card} role="group" aria-label="Details" tabindex="-1">
        <Stack gap={4}>
          <p>Escape closes this card first, then the modal.</p>
          <Button size="sm" kind="secondary">Learn more</Button>
        </Stack>
      </div>
    {/if}
  </Stack>
</Modal>
