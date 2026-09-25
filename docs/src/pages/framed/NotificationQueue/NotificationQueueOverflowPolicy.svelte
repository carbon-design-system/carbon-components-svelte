<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
    RadioButton,
    RadioButtonGroup,
    Stack,
  } from "carbon-components-svelte";

  let queue;
  let overflowPolicy = "low-priority";
  let count = 0;

  function add(kind) {
    count += 1;
    queue.add({
      kind,
      title: `${kind === "error" ? "Error" : "Info"} ${count}`,
    });
  }
</script>

<NotificationQueue bind:this={queue} maxNotifications={3} {overflowPolicy} />

<Stack gap={5}>
  <RadioButtonGroup legendText="Overflow policy" bind:selected={overflowPolicy}>
    <RadioButton labelText="Low priority first" value="low-priority" />
    <RadioButton labelText="Oldest first" value="oldest" />
  </RadioButtonGroup>

  <ButtonSet>
    <Button kind="danger" on:click={() => add("error")}>Add error</Button>
    <Button kind="secondary" on:click={() => add("info")}>Add info</Button>
    <Button kind="ghost" on:click={() => queue.clear()}>Clear all</Button>
  </ButtonSet>
</Stack>
