<script>
  import { Button, Stack } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  let submitting = false;
  let adding = false;

  async function simulate(duration = 2000) {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  async function onSubmit() {
    submitting = true;
    await simulate();
    submitting = false;
  }

  async function onAdd() {
    adding = true;
    await simulate();
    adding = false;
  }
</script>

<Stack orientation="horizontal" gap={5}>
  <Button loading={submitting} on:click={onSubmit}>Submit</Button>
  <Button
    loading={adding}
    loadingDescription="Adding item"
    iconDescription="Add item"
    icon={Add}
    on:click={onAdd}
  />
</Stack>
