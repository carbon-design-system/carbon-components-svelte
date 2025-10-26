<script>
  import {
    RadioButton,
    RadioButtonGroup,
    Theme,
  } from "carbon-components-svelte";

  let theme = "g90";
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />

<RadioButtonGroup legendText="Carbon theme" bind:selected={theme}>
  {#each ["white", "g10", "g80", "g90", "g100"] as value}
    <RadioButton labelText={value} {value} />
  {/each}
</RadioButtonGroup>
