<script>
  import {
    ButtonSet,
    Button,
    FormGroup,
    RadioButtonGroup,
    RadioButton,
  } from "carbon-components-svelte";

  let plan = "standard";
</script>

<FormGroup legendText="Storage tier (disk)">
  <RadioButtonGroup bind:selected="{plan}">
    <RadioButton labelText="Free (1 GB)" value="free" />
    <RadioButton labelText="Standard (10 GB)" value="standard" />
    <RadioButton labelText="Pro (128 GB)" value="pro" />
  </RadioButtonGroup>
</FormGroup>

<ButtonSet>
  {#each ['free', 'standard', 'pro'] as value}
    <Button
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
