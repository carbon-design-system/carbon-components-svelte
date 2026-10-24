<script>
  import {
    Button,
    Content,
    Header,
    RadioButton,
    RadioButtonGroup,
    SidePanel,
    Stack,
  } from "carbon-components-svelte";

  const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"];

  let open = true;
  let size = "md";
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Stack gap={5}>
    <RadioButtonGroup legendText="Size" bind:selected={size}>
      {#each sizes as value (value)}
        <RadioButton labelText={value} {value} />
      {/each}
    </RadioButtonGroup>
    <Button on:click={() => (open = true)}>View service</Button>
  </Stack>
</Content>

<SidePanel bind:open {size} title="checkout-api">
  <p>Node.js web service in US East, on the Standard plan.</p>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Close</Button>
    <Button>Open dashboard</Button>
  </svelte:fragment>
</SidePanel>
