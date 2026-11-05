<script lang="ts">
  import { Stack, Swatch, Tag, TagSet } from "carbon-components-svelte";

  const colors = [
    "red",
    "magenta",
    "purple",
    "blue",
    "cyan",
    "teal",
    "green",
    "gray",
  ] as const;
  const teams = ["Platform", "Design", "Billing", "Security", "Data"];
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={3} wrap="wrap" data-testid="palette">
    {#each colors as color}
      <Tag type="gray">
        <Swatch slot="icon" {color} />
        {color}
      </Tag>
    {/each}
  </Stack>

  <Stack orientation="horizontal" gap={3} wrap="wrap" data-testid="hashed">
    {#each teams as team}
      <Tag type="gray">
        <Swatch slot="icon" colorKey={team} />
        {team}
      </Tag>
    {/each}
  </Stack>

  <Stack orientation="horizontal" gap={3} wrap="wrap" data-testid="sizes">
    <Tag type="gray" size="sm">
      <Swatch slot="icon" size="sm" color="green" />
      Small
    </Tag>
    <Tag type="gray">
      <Swatch slot="icon" color="green" />
      Default
    </Tag>
    <Tag type="gray" size="lg">
      <Swatch slot="icon" color="green" />
      Large
    </Tag>
    <Tag type="gray" size="lg">
      <Swatch slot="icon" cssColor="#ff7eb6" />
      Custom
    </Tag>
  </Stack>

  <Stack
    orientation="horizontal"
    gap={3}
    align="center"
    wrap="wrap"
    data-testid="tag-sizes"
  >
    <Tag type="gray" size="xs">
      <Swatch slot="icon" colorKey="Platform" />
      Extra small
    </Tag>
    <Tag type="gray" size="sm">
      <Swatch slot="icon" colorKey="Platform" />
      Small
    </Tag>
    <TagSet size="sm">
      <Tag type="gray">
        <Swatch slot="icon" colorKey="Platform" />
        In a small TagSet
      </Tag>
    </TagSet>
    <Tag type="gray">
      <Swatch slot="icon" colorKey="Platform" />
      Default
    </Tag>
    <Tag type="gray" size="lg">
      <Swatch slot="icon" colorKey="Platform" />
      Large
    </Tag>
    <Tag type="gray" size="sm">
      <Swatch slot="icon" size="md" color="green" />
      Explicit md
    </Tag>
  </Stack>

  <Stack orientation="horizontal" gap={3} wrap="wrap" data-testid="outline">
    <Tag type="outline">
      <Swatch slot="icon" color="purple" />
      Outline
    </Tag>
    <Tag type="blue">
      <Swatch slot="icon" color="red" />
      On a blue tag
    </Tag>
  </Stack>

  <Stack orientation="horizontal" gap={3} wrap="wrap" data-testid="variants">
    <Tag type="gray" filter title="Remove Design">
      <Swatch slot="icon" colorKey="Design" />
      Design
    </Tag>
    <Tag type="gray" interactive>
      <Swatch slot="icon" colorKey="Billing" />
      Billing
    </Tag>
    <Tag type="high-contrast">
      <Swatch slot="icon" colorKey="Data" />
      High contrast
    </Tag>
    <Tag type="gray" interactive disabled>
      <Swatch slot="icon" colorKey="Security" />
      Disabled
    </Tag>
  </Stack>

  <Stack orientation="horizontal" gap={5} data-testid="legend">
    {#each ["Open", "Closed"] as name, i}
      <Stack orientation="horizontal" gap={3} align="center">
        <Swatch label={name} color={i ? "teal" : "magenta"} />
        <span>{name}</span>
      </Stack>
    {/each}
  </Stack>
</Stack>
