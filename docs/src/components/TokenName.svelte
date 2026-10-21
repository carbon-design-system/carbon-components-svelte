<script lang="ts">
  import { CopyButton, Stack, Text } from "carbon-components-svelte";
  import { cssVar, sassVar } from "../token-reference";

  export let name: string;
  /** Set to `false` for tokens without a single CSS or Sass variable. */
  export let copyable = true;
</script>

<Stack gap={2}>
  <Text tag="span" type="heading-compact-01" color="primary" wrap="break-word">
    {name}
  </Text>
  {#if copyable}
    {#each [
      { label: "CSS variable", text: cssVar(name) },
      { label: "Sass variable", text: sassVar(name) },
    ] as copy (copy.label)}
      <Stack orientation="horizontal" gap={1} align="center">
        <Text tag="code" type="code-01" color="secondary" wrap="break-word">
          {copy.text}
        </Text>
        <CopyButton
          kind="ghost"
          size="sm"
          text={copy.text}
          iconDescription="Copy {copy.label}"
          tooltipPosition="right"
        />
      </Stack>
    {/each}
  {/if}
</Stack>
