<script>
  import { Box, Flag, Stack, Text, ThemeZone } from "carbon-components-svelte";
  import { flags } from "carbon-components-svelte/flags/all";

  const sizes = [16, 20, 24, 32];
  const themes = [
    { theme: "white", label: "White" },
    { theme: "g100", label: "Gray 100" },
  ];
</script>

{#each themes as { theme, label }}
  <ThemeZone {theme}>
    <Box padding={5}>
      <Stack gap={6}>
        {#each sizes as size}
          <Stack gap={3}>
            <Text type="heading-compact-01">{label}, {size}px</Text>
            <Stack orientation="horizontal" gap={3} wrap="wrap">
              {#each Object.values(flags) as flag (flag.code)}
                <Flag {flag} {size} title={flag.code} />
              {/each}
            </Stack>
          </Stack>
        {/each}
      </Stack>
    </Box>
  </ThemeZone>
{/each}
