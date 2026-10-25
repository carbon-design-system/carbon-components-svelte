<script>
  import {
    Box,
    Button,
    Stack,
    TextInput,
    trapFocus,
  } from "carbon-components-svelte";

  let open = false;
  let container;

  function handleKeydown(event) {
    if (event.key === "Tab") trapFocus({ container, event });
    if (event.key === "Escape") open = false;
  }
</script>

<Button on:click={() => (open = true)}>Invite teammate</Button>

{#if open}
  <Box
    bind:ref={container}
    role="dialog"
    aria-label="Invite teammate"
    tabindex="-1"
    on:keydown={handleKeydown}
    marginTop={5}
    padding={5}
    maxWidth="20rem"
    fill="layer-01"
  >
    <Stack gap={5}>
      <TextInput labelText="Email" placeholder="ada@acme-corp.com" />
      <Stack orientation="horizontal" gap={3}>
        <Button size="small" on:click={() => (open = false)}
          >Send invite</Button
        >
        <Button size="small" kind="ghost" on:click={() => (open = false)}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  </Box>
{/if}
