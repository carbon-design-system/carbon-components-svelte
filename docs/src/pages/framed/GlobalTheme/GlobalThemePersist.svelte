<script>
  import {
    GlobalTheme,
    RadioButtonGroup,
    RadioButton,
  } from "carbon-components-svelte";

  let theme = "g90";
</script>

<GlobalTheme bind:theme persist persistKey="__carbon-theme" />

<RadioButtonGroup legendText="Carbon theme" bind:selected="{theme}">
  {#each ["white", "g10", "g80", "g90", "g100"] as value}
    <RadioButton labelText="{value}" value="{value}" />
  {/each}
</RadioButtonGroup>
