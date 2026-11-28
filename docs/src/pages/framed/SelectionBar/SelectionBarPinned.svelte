<script>
  import {
    Box,
    Button,
    Checkbox,
    SelectionBar,
  } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";

  const icons = ["Add", "Archive", "Bookmark", "Calendar", "Chat", "Cloud"];

  let pinned = [];

  function toggle(name, checked) {
    pinned = checked
      ? [...pinned, name]
      : pinned.filter((pinnedName) => pinnedName !== name);
  }
</script>

<!-- Room at the end of the page, so the bar never covers the last row. -->
<Box paddingBottom={10}>
  <fieldset>
    <legend class="bx--label">Icons</legend>
    {#each icons as name (name)}
      <Checkbox
        labelText={name}
        checked={pinned.includes(name)}
        on:check={(event) => toggle(name, event.detail)}
      />
    {/each}
  </fieldset>
</Box>

<SelectionBar
  count={pinned.length}
  placement="viewport-end"
  transition
  selectedText={(count) => `${count} ${count === 1 ? "icon" : "icons"} pinned`}
  on:clear={() => (pinned = [])}
>
  <svelte:fragment slot="actions">
    <Button
      icon={Copy}
      on:click={() =>
        navigator.clipboard.writeText(
          pinned
            .map(
              (name) =>
                `import ${name} from "carbon-icons-svelte/lib/${name}.svelte";`,
            )
            .join("\n"),
        )}
    >
      Copy imports
    </Button>
  </svelte:fragment>
</SelectionBar>
