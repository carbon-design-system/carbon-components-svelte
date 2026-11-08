<script lang="ts">
  import { CopyText, Stack, Text } from "carbon-components-svelte";
  import { cssVar, sassVar } from "../token-reference";

  export let name: string;
  /** Set to `false` for tokens without a single CSS or Sass variable. */
  export let copyable = true;
</script>

<!-- One tight group: the name and the variables that set it. -->
<Stack gap={1}>
  <Text tag="span" type="heading-compact-01" color="primary" wrap="break-word">
    {name}
  </Text>
  {#if copyable}
    {#each [{ label: "CSS variable", text: cssVar(name) }, { label: "Sass variable", text: sassVar(name) }] as copy (copy.label)}
      <CopyText
        text={copy.text}
        iconDescription="Copy {copy.label}"
        tooltipPosition="right"
      >
        <Text tag="span" type="label-01" color="secondary" wrap="nowrap">
          {copy.text}
        </Text>
      </CopyText>
    {/each}
  {/if}
</Stack>
