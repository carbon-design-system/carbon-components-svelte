<script>
  import { announce, Announcer, Button, Stack } from "carbon-components-svelte";

  let saves = 0;

  async function save() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    saves += 1;
    announce(`Saved. ${saves} ${saves === 1 ? "change" : "changes"} today.`, {
      channel: "save",
    });
  }

  function fail() {
    announce("Could not save the deployment.", { politeness: "assertive" });
  }
</script>

<!-- Near the root of the app, outside any inert or aria-hidden container. -->
<Announcer />

<Stack orientation="horizontal" gap={4}>
  <Button on:click={save}>Save</Button>
  <Button kind="danger-tertiary" on:click={fail}>Fail</Button>
</Stack>
