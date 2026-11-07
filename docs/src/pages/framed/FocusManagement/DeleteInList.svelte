<script>
  import { Button, captureFocusTarget, Stack } from "carbon-components-svelte";

  let tasks = ["Build", "Test", "Lint", "Deploy"];
  let list;
  let status = "";

  /**
   * @param {Event} event
   * @param {string} task
   */
  function remove(event, task) {
    const restore = captureFocusTarget(
      /** @type {HTMLElement} */ (event.currentTarget).closest("li"),
      {
        siblings: "li",
        fallback: () => list,
        announce: ({ reason }) => {
          status = `${task} deleted, focus on ${reason === "fallback" ? "the list" : `${reason} task`}`;
        },
      },
    );
    tasks = tasks.filter((t) => t !== task);
    restore();
  }
</script>

<Stack gap={3}>
  <ul bind:this={list} tabindex="-1" aria-label="Tasks">
    {#each tasks as task (task)}
      <li>
        <Stack as orientation="horizontal" gap={3} let:props>
          <span {...props}>{task}</span>
          <Button
            size="small"
            kind="danger-ghost"
            on:click={(event) => remove(event, task)}
          >
            Delete {task}
          </Button>
        </Stack>
      </li>
    {/each}
  </ul>
  <p role="status">{status}</p>
</Stack>
