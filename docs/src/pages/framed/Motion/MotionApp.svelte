<script>
  import {
    Button,
    Dropdown,
    InlineLoading,
    InlineNotification,
    Motion,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
    Tile,
    Toggle,
    Tooltip,
  } from "carbon-components-svelte";

  let animate = true;
  let region = "us-east";
  /** @type {"idle" | "deploying" | "done"} */
  let state = "idle";

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  function deploy() {
    clearTimeout(timer);
    state = "deploying";
    timer = setTimeout(() => (state = "done"), 1500);
  }
</script>

<Motion transition={animate}>
  <Stack gap={6}>
    <Toggle labelText="Motion" bind:toggled={animate} />
    <Tile>
      <Stack gap={6}>
        <Stack orientation="horizontal" justify="space-between" align="center">
          <Stack orientation="horizontal" gap={3} align="center">
            <h4>api-gateway</h4>
            <Tooltip triggerText="" iconDescription="About this service">
              Routes public traffic to the internal services.
            </Tooltip>
          </Stack>
          <OverflowMenu flipped iconDescription="Service actions">
            <OverflowMenuItem text="View logs" />
            <OverflowMenuItem text="Restart" />
            <OverflowMenuItem danger text="Delete service" />
          </OverflowMenu>
        </Stack>
        <Dropdown
          labelText="Region"
          bind:selectedId={region}
          items={[
            { id: "us-east", text: "US East (Virginia)" },
            { id: "eu-west", text: "EU West (Frankfurt)" },
            { id: "ap-south", text: "Asia Pacific (Singapore)" },
          ]}
        />
        <Stack orientation="horizontal" gap={5} align="center">
          <Button disabled={state === "deploying"} on:click={deploy}>
            Deploy
          </Button>
          {#if state === "deploying"}
            <InlineLoading description="Deploying..." />
          {/if}
        </Stack>
        {#if state === "done"}
          <InlineNotification
            kind="success"
            title="Deployed:"
            subtitle="api-gateway is live in the new region."
          />
        {/if}
      </Stack>
    </Tile>
  </Stack>
</Motion>
