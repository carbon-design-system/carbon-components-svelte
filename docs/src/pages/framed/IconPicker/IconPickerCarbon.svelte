<script>
  import { Box, IconPicker, Stack } from "carbon-components-svelte";

  // The list of icons is its own file, so it loads when the picker first opens.
  const items = () =>
    import("./all-carbon-icons.js").then((module) => module.default);

  let value = "Notification";
  let icon;
</script>

<Stack gap={5}>
  <Box maxWidth="20rem">
    <IconPicker
      labelText="Icon"
      helperText="Search every Carbon icon"
      {items}
      bind:value
      on:change={({ detail }) => (icon = detail.icon)}
    />
  </Box>
  <p>
    Chosen: <code>{value}</code>
    {#if icon}
      <svelte:component this={icon} size={24} />
    {/if}
  </p>
</Stack>
