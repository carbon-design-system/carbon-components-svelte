<script lang="ts">
  import { SavingStatus, Stack } from "carbon-components-svelte";

  const statuses = [
    "idle",
    "unsaved",
    "saving",
    "saved",
    "error",
    "offline",
  ] as const;
</script>

<Stack gap={6}>
  {#each ["md", "sm"] as const as size}
    <Stack gap={3} data-testid="statuses-{size}">
      {#each statuses as status}
        <SavingStatus
          {size}
          {status}
          error={status === "error"
            ? new Error("The server answered 503.")
            : undefined}
          data-testid="{size}-{status}"
        />
      {/each}
    </Stack>
  {/each}
</Stack>
