<script lang="ts">
  import { Stack } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  const gaps: ComponentProps<Stack>["gap"][] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
  ];
</script>

{#each gaps as gap}
  <Stack {gap}>
    <p>gap-{gap}</p>
  </Stack>
{/each}

<Stack orientation="horizontal" gap={1}>
  <span>horizontal-gap-1</span>
</Stack>

<Stack orientation="horizontal" gap={5}>
  <span>horizontal-gap-5</span>
</Stack>

<Stack orientation="horizontal" gap={13}>
  <span>horizontal-gap-13</span>
</Stack>

<Stack gap="200px">
  <p>custom-gap-200px</p>
</Stack>

<Stack gap="1.5rem">
  <p>custom-gap-1.5rem</p>
</Stack>

<Stack tag="ul" gap={3}>
  <li>custom-tag-ul</li>
</Stack>

<Stack tag="section" gap={5}>
  <div>custom-tag-section</div>
</Stack>

<Stack tag="ol" gap={13} orientation="horizontal">
  <li>combined-props</li>
</Stack>

<Stack gap={0}>
  <p>gap-0</p>
</Stack>

<Stack orientation="horizontal" gap={0}>
  <span>horizontal-gap-0</span>
</Stack>

<Stack inline>
  <p>inline-default</p>
</Stack>

<Stack inline gap={3} orientation="horizontal">
  <span>inline-horizontal</span>
</Stack>
