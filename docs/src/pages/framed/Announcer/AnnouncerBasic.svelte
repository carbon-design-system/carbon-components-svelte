<script>
  import { announce, Announcer, Button } from "carbon-components-svelte";

  let saves = 0;

  async function save() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    saves += 1;
    announce(`Saved. ${saves} ${saves === 1 ? "change" : "changes"} today.`, {
      channel: "save",
    });
  }
</script>

<!-- Near the root of the app, outside any inert or aria-hidden container. -->
<Announcer />

<Button on:click={save}>Save</Button>
