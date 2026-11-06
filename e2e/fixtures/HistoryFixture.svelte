<script>
  import {
    Button,
    createHistory,
    historyKeys,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import HistoryCommands from "../../docs/src/pages/framed/History/HistoryCommands.svelte";
  import HistoryGesture from "../../docs/src/pages/framed/History/HistoryGesture.svelte";
  import HistorySnapshots from "../../docs/src/pages/framed/History/HistorySnapshots.svelte";

  // A field recorded when the user commits it (on change), left to the
  // browser while they type: the case for `fields: "fallthrough"`.
  let committed = "";
  let applied = [];
  const history = createHistory();
  const { canUndo } = history;
  const snapshots = history.snapshots({
    initial: "",
    apply: (next) => {
      committed = next;
      applied = [...applied, next];
    },
  });

  function record(value) {
    committed = value;
    snapshots.record(value, { label: "commit" });
  }
</script>

<Stack gap={9}>
  <section data-testid="commands"><HistoryCommands /></section>
  <section data-testid="snapshots"><HistorySnapshots /></section>
  <section data-testid="gesture"><HistoryGesture /></section>
  <section
    data-testid="fallthrough"
    use:historyKeys={{ history, fields: "fallthrough" }}
  >
    <Stack gap={3}>
      <TextInput
        labelText="Committed on change"
        value={committed}
        on:change={(e) =>
          snapshots.record(String(e.detail), { label: "commit" })}
      />
      <Button size="small" kind="secondary" on:click={() => record("x")}
        >Record x</Button
      >
      <output data-testid="committed">{committed}</output>
      <output data-testid="committed-undoable">{$canUndo}</output>
      <output data-testid="applied">{applied.join("|")}</output>
    </Stack>
  </section>
</Stack>
