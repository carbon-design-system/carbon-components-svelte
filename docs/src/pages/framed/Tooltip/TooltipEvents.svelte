<script>
  import { Stack, Tooltip } from "carbon-components-svelte";

  let events = [];
</script>

<Stack gap={4}>
  <Tooltip
    triggerText="Resource list"
    on:open={() => (events = [...events, "open"])}
    on:close={() => (events = [...events, "close"])}
  >
    <p>Resources are provisioned based on your account's organization.</p>
  </Tooltip>
  <p>Dispatched events: {events.join(", ")}</p>
</Stack>
