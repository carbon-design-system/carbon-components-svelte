<script>
  import { Popconfirm, Stack, Tag } from "carbon-components-svelte";

  let environments = ["production", "staging", "qa-eu", "sandbox"];
</script>

<Stack orientation="horizontal" gap={3}>
  {#each environments as environment (environment)}
    <Popconfirm
      title="Remove {environment}?"
      description="The service stops deploying there."
      confirmText="Remove"
      kind="warning"
      direction="top"
      on:confirm={() =>
        (environments = environments.filter((e) => e !== environment))}
    >
      <Tag type="blue">{environment}</Tag>
    </Popconfirm>
  {/each}
</Stack>
