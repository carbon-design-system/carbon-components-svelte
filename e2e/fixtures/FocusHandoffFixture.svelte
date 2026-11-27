<script>
  import {
    Button,
    captureFocusTarget,
    DataTable,
    focusHandoff,
    Stack,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "actions", value: "Actions" },
  ];

  let rows = Array.from({ length: 6 }, (_, i) => ({
    id: `r${i + 1}`,
    name: `Row ${i + 1}`,
  }));

  let notes = ["n1", "n2", "n3"];
  let tasks = ["alpha", "bravo", "charlie", "delta"];
  let announcement = "";
  let panelOpen = false;
  let panel;
  let trigger;
  let running = true;
  let toggleWrap;
  let tasksRef;

  function removeTask(event, id) {
    const restore = captureFocusTarget(event.currentTarget.closest("li"), {
      siblings: "li",
      fallback: () => tasksRef,
      announce: ({ reason }) => {
        announcement = `Task deleted, focus on ${reason} task`;
      },
    });
    tasks = tasks.filter((t) => t !== id);
    restore();
  }

  function moveTaskUp(id) {
    const i = tasks.indexOf(id);
    if (i < 1) return;
    const next = tasks.slice();
    next.splice(i - 1, 2, tasks[i], tasks[i - 1]);
    tasks = next;
  }

  function moveRowUp(id) {
    const i = rows.findIndex((r) => r.id === id);
    if (i < 1) return;
    const next = rows.slice();
    next.splice(i - 1, 2, rows[i], rows[i - 1]);
    rows = next;
  }

  function closePanel() {
    const restore = captureFocusTarget(panel, { fallback: () => trigger });
    panelOpen = false;
    restore();
  }

  function toggle() {
    const restore = captureFocusTarget(toggleWrap, {
      find: () => toggleWrap.querySelector("button"),
    });
    running = !running;
    restore();
  }
</script>

<Stack gap={6}>
  <h1>Focus handoff</h1>

  <section aria-label="Rows">
    <DataTable {headers} {rows}>
      <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "actions"}
          <Button size="small" kind="ghost" on:click={() => moveRowUp(row.id)}>
            Move {row.name} up
          </Button>
          <Button
            size="small"
            kind="danger-ghost"
            on:click={() => (rows = rows.filter((r) => r.id !== row.id))}
          >
            Delete {row.name}
          </Button>
        {:else}
          {cell.value}
        {/if}
      </svelte:fragment>
    </DataTable>
    <Button
      kind="tertiary"
      on:click={() => (rows = rows.filter((r) => r.id !== "r2"))}
    >
      App removes Row 2
    </Button>
  </section>

  <section aria-label="Tasks">
    <ul bind:this={tasksRef} tabindex="-1" data-testid="tasks">
      {#each tasks as id (id)}
        <li data-id={id}>
          {id}
          <Button size="small" kind="ghost" on:click={() => moveTaskUp(id)}>
            Move {id} up
          </Button>
          <Button
            size="small"
            kind="danger-ghost"
            on:click={(e) => removeTask(e, id)}
          >
            Delete {id}
          </Button>
        </li>
      {/each}
    </ul>
    <p role="status" data-testid="announcement">{announcement}</p>
  </section>

  <section aria-label="Notes">
    <ul tabindex="-1" data-testid="notes" use:focusHandoff={{ items: "li" }}>
      {#each notes as id (id)}
        <li>
          {id}
          <Button
            size="small"
            kind="danger-ghost"
            on:click={() => (notes = notes.filter((n) => n !== id))}
          >
            Delete {id}
          </Button>
        </li>
      {/each}
    </ul>
  </section>

  <section aria-label="Panel">
    <Button bind:ref={trigger} on:click={() => (panelOpen = true)}>
      Open panel
    </Button>
    {#if panelOpen}
      <div bind:this={panel} data-testid="panel">
        <p>Panel</p>
        <Button size="small" on:click={closePanel}>Close panel</Button>
      </div>
    {/if}
  </section>

  <section aria-label="Toggle" bind:this={toggleWrap}>
    {#if running}
      <Button kind="secondary" on:click={toggle}>Cancel run</Button>
    {:else}
      <Button kind="secondary" on:click={toggle}>Retry run</Button>
    {/if}
  </section>
</Stack>
