<script>
  import { PeoplePicker } from "carbon-components-svelte";
  import { onMount, tick } from "svelte";
  import { team } from "./people-picker-data.js";

  /** @type {null | HTMLInputElement} */
  let ref = null;
  let value = [team[2]];

  // Opens the menu the way a key does, so the sweep sees it open.
  onMount(async () => {
    await tick();
    if (!ref) return;
    ref.focus();
    ref.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
  });
</script>

<PeoplePicker
  bind:ref
  bind:value
  labelText="Assignees"
  items={team}
  suggestions={team.slice(0, 6)}
/>
