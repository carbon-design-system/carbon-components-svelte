<script>
  import { CopyInput, Stack } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const dir = params.get("dir") ?? undefined;
</script>

<div {dir}>
  <Stack gap={5}>
    {#each ["sm", "md", "xl"] as size}
      <div data-testid="toggle-{size}">
        <CopyInput
          labelText="API token {size}"
          type="password"
          revealMode="toggle"
          {size}
          value="sk-1234567890abcdef"
        />
      </div>
    {/each}
    <div data-testid="toggle-fluid">
      <CopyInput
        fluid
        labelText="API token fluid"
        type="password"
        revealMode="toggle"
        value="sk-1234567890abcdef"
      />
    </div>
  </Stack>
</div>
