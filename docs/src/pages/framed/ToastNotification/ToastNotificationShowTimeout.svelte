<script>
  import { Button, Stack, ToastNotification } from "carbon-components-svelte";

  const kinds = [
    ["error", "Error"],
    ["info", "Info"],
    ["info-square", "Info square"],
    ["success", "Success"],
    ["warning", "Warning"],
    ["warning-alt", "Warning alt"],
  ];

  let run = 0;
</script>

<Stack gap={5}>
  <Button on:click={() => run++}>Restart timeouts</Button>

  {#key run}
    <Stack orientation="horizontal" gap={5} wrap="wrap">
      {#each [false, true] as lowContrast}
        <div>
          {#each kinds as [kind, label]}
            <ToastNotification
              timeout={10_000}
              showTimeout
              pauseOnHover
              {kind}
              {lowContrast}
              title={label}
              subtitle={lowContrast ? "Low contrast" : "Default"}
            />
          {/each}
        </div>
      {/each}
    </Stack>
  {/key}
</Stack>
