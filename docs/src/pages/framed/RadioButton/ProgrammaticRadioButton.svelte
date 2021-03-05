<script>
  import {
    ButtonSet,
    Button,
    RadioButtonGroup,
    RadioButton,
  } from "carbon-components-svelte";

  let plan = "standard";
</script>

<RadioButtonGroup legendText="Storage tier (disk)" bind:selected="{plan}">
  <RadioButton labelText="Free (1 GB)" value="free" />
  <RadioButton labelText="Standard (10 GB)" value="standard" />
  <RadioButton labelText="Pro (128 GB)" value="pro" />
</RadioButtonGroup>

<ButtonSet style="margin-top: var(--cds-layout-03)">
  {#each ["free", "standard", "pro"] as value}
    <Button
      disabled="{plan === value}"
      kind="secondary"
      on:click="{() => {
        plan = value;
      }}"
    >
      Select "{value}"
    </Button>
  {/each}
</ButtonSet>

<div style="margin: var(--cds-layout-01) 0">
  Selected plan:
  <strong>{plan}</strong>
</div>
