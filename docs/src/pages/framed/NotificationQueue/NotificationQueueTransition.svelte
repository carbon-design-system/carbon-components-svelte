<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
    RadioButton,
    RadioButtonGroup,
    Stack,
  } from "carbon-components-svelte";

  const messages = [
    { kind: "success", title: "Deployment succeeded" },
    { kind: "info", title: "Scheduled maintenance" },
    { kind: "warning", title: "Certificate expiring soon" },
  ];

  let queue;
  let position = "top-right";
  let count = 0;

  function add() {
    queue.add({ ...messages[count % messages.length], timeout: 6_000 });
    count += 1;
  }
</script>

<NotificationQueue bind:this={queue} {position} transition />

<Stack gap={6}>
  <RadioButtonGroup legendText="Position" bind:selected={position}>
    <RadioButton labelText="Top right" value="top-right" />
    <RadioButton labelText="Top center" value="top-center" />
    <RadioButton labelText="Bottom left" value="bottom-left" />
  </RadioButtonGroup>
  <ButtonSet>
    <Button on:click={add}>Add notification</Button>
    <Button kind="tertiary" on:click={() => queue.clear()}>Clear all</Button>
  </ButtonSet>
</Stack>
