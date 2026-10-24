<script>
  import {
    Button,
    Content,
    Header,
    Select,
    SelectItem,
    SidePanel,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  const steps = ["Create service", "Choose a plan"];

  let open = true;
  let currentStep = 0;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button
    on:click={() => {
      currentStep = 0;
      open = true;
    }}
  >
    Create service
  </Button>
</Content>

<SidePanel
  bind:open
  {currentStep}
  title={steps[currentStep]}
  on:back={() => (currentStep -= 1)}
>
  {#if currentStep === 0}
    <Stack gap={6}>
      <TextInput labelText="Service name" value="checkout-api" />
      <TextInput labelText="Repository" value="acme/checkout" />
    </Stack>
  {:else}
    <Select labelText="Plan" selected="standard">
      <SelectItem value="starter" text="Starter" />
      <SelectItem value="standard" text="Standard" />
      <SelectItem value="pro" text="Pro" />
    </Select>
  {/if}
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    {#if currentStep === 0}
      <Button on:click={() => (currentStep = 1)}>Next</Button>
    {:else}
      <Button on:click={() => (open = false)}>Create</Button>
    {/if}
  </svelte:fragment>
</SidePanel>
