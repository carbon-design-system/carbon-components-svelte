<script>
  import {
    Button,
    ButtonSet,
    createHistory,
    historyKeys,
    Kbd,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import { tick } from "svelte";

  let nextId = 4;
  let items = [
    { id: 1, name: "Ada Lovelace" },
    { id: 2, name: "Grace Hopper" },
    { id: 3, name: "Katherine Johnson" },
  ];
  let name = "";
  let status = "";
  let region;

  const history = createHistory({
    announce: (message) => (status = message),
  });
  const { canUndo, canRedo, undoLabel, redoLabel } = history;

  /** Run a command whose `do` and `undo` set the list outright. */
  function change(label, next) {
    const before = items;
    history.run({
      label,
      do: () => (items = next),
      undo: () => (items = before),
    });
  }

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    change(`add ${trimmed}`, [...items, { id: nextId++, name: trimmed }]);
    name = "";
  }

  async function remove(item) {
    change(
      `delete ${item.name}`,
      items.filter((other) => other !== item),
    );
    // The button that had focus is gone. Keep focus in the region, so the
    // keys still reach it.
    await tick();
    region.focus();
  }

  function move(item, offset) {
    const from = items.indexOf(item);
    const to = from + offset;
    if (offset === 0 || to < 0 || to >= items.length) return;
    const next = items.slice();
    next.splice(from, 1);
    next.splice(to, 0, item);
    change(`move ${item.name} ${offset < 0 ? "up" : "down"}`, next);
  }

  /** Moving a row in the DOM drops focus, so put it back on the button. */
  async function nudge(item, offset, event) {
    const button = event.currentTarget;
    move(item, offset);
    await tick();
    button.focus();
  }

  /** Several moves that undo together. */
  function sort() {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    history.transaction("sort by name", () => {
      sorted.forEach((item, index) => move(item, index - items.indexOf(item)));
    });
  }
</script>

<div bind:this={region} tabindex="-1" use:historyKeys={history}>
  <Stack gap={5}>
    <ButtonSet>
      <Button
        kind="tertiary"
        size="small"
        disabled={!$canUndo}
        on:click={() => history.undo()}
      >
        Undo{$undoLabel ? ` ${$undoLabel}` : ""}
      </Button>
      <Button
        kind="tertiary"
        size="small"
        disabled={!$canRedo}
        on:click={() => history.redo()}
      >
        Redo{$redoLabel ? ` ${$redoLabel}` : ""}
      </Button>
    </ButtonSet>
    <div>
      <Button kind="ghost" size="small" on:click={sort}>Sort by name</Button>
    </div>

    <p>
      <Kbd shortcut="mod+z" /> undoes, <Kbd shortcut="mod+shift+z" /> redoes.
    </p>

    <ul>
      {#each items as item (item.id)}
        <li>
          <Stack gap={2}>
            <span>{item.name}</span>
            <Stack orientation="horizontal" gap={3}>
              <Button
                kind="ghost"
                size="small"
                aria-label="Move {item.name} up"
                on:click={(e) => nudge(item, -1, e)}>Up</Button
              >
              <Button
                kind="ghost"
                size="small"
                aria-label="Move {item.name} down"
                on:click={(e) => nudge(item, 1, e)}>Down</Button
              >
              <Button
                kind="danger-ghost"
                size="small"
                aria-label="Delete {item.name}"
                on:click={() => remove(item)}>Delete</Button
              >
            </Stack>
          </Stack>
        </li>
      {/each}
    </ul>

    <form on:submit|preventDefault={add}>
      <Stack orientation="horizontal" gap={3} align="end">
        <TextInput labelText="Name" size="sm" bind:value={name} />
        <Button type="submit" size="small" kind="secondary">Add</Button>
      </Stack>
    </form>

    <p role="status">{status || "Nothing undone yet."}</p>
  </Stack>
</div>
