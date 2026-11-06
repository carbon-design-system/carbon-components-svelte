<script lang="ts">
  import { historyKeys } from "carbon-components-svelte/utils/history-keys.js";
  import { createHistory } from "carbon-components-svelte/utils/history.js";

  export let fields: "native" | "fallthrough" | "app" = "native";

  let count = 0;
  let text = "";
  let messages: string[] = [];

  const history = createHistory({
    announce: (message: string) => (messages = [...messages, message]),
  });
  const { canUndo, canRedo, undoLabel } = history;
  const form = history.snapshots({
    initial: "",
    apply: (value: string) => (text = value),
  });

  function add() {
    const from = count;
    count += 1;
    const to = count;
    history.push({
      label: "add",
      do: () => (count = to),
      undo: () => (count = from),
    });
  }

  function type(event: Event & { currentTarget: HTMLInputElement }) {
    text = event.currentTarget.value;
    form.record(text, { key: "text", label: "edit" });
  }
</script>

<div data-testid="host" use:historyKeys={{ history, fields }}>
  <button type="button" data-testid="add" on:click={add}>Add</button>
  <button
    type="button"
    data-testid="undo"
    disabled={!$canUndo}
    on:click={() => history.undo()}
  >
    Undo {$undoLabel ?? ""}
  </button>
  <button
    type="button"
    data-testid="redo"
    disabled={!$canRedo}
    on:click={() => history.redo()}
  >
    Redo
  </button>
  <input data-testid="field" value={text} on:input={type} />
  <output data-testid="count">{count}</output>
  <output data-testid="text">{text}</output>
  <output data-testid="messages">{messages.join("|")}</output>
</div>
