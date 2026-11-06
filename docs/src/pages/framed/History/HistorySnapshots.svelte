<script>
  import {
    Button,
    Checkbox,
    createHistory,
    historyKeys,
    Kbd,
    RadioButton,
    RadioButtonGroup,
    Stack,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";

  let values = { name: "", email: "", bio: "", updates: false };
  let fields = "app";
  let status = "";

  const history = createHistory({
    coalesceMs: 700,
    announce: (message) => (status = message),
  });
  const { canUndo, canRedo, undoLabel } = history;

  // Each state is a new object, so a step costs the fields that changed.
  const form = history.snapshots({
    initial: values,
    apply: (next) => (values = next),
  });

  function edit(field, value, label) {
    // Setting a control from script can echo an event with the same value.
    if (values[field] === value) return;
    values = { ...values, [field]: value };
    // Typing in one field folds into one step; a toggle is a step each time.
    form.record(values, {
      key: typeof value === "string" ? field : undefined,
      label: `edit ${label}`,
    });
  }
</script>

<div use:historyKeys={{ history, fields, scope: "document" }}>
  <Stack gap={6}>
    <RadioButtonGroup
      legendText="Undo in a text field"
      orientation="vertical"
      bind:selected={fields}
    >
      <RadioButton
        value="app"
        labelText="The form's history (typing is recorded in bursts)"
      />
      <RadioButton value="native" labelText="The browser only" />
    </RadioButtonGroup>

    <Stack orientation="horizontal" gap={3}>
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
        Redo
      </Button>
    </Stack>

    <p>
      <Kbd shortcut="mod+z" /> undoes, <Kbd shortcut="mod+shift+z" /> redoes.
    </p>

    <TextInput
      labelText="Name"
      value={values.name}
      on:input={(e) => edit("name", e.detail, "name")}
    />
    <TextInput
      labelText="Email"
      type="email"
      value={values.email}
      on:input={(e) => edit("email", e.detail, "email")}
    />
    <TextArea
      labelText="Bio"
      rows={3}
      value={values.bio}
      on:input={(e) => edit("bio", e.currentTarget.value, "bio")}
    />
    <Checkbox
      labelText="Send me product updates"
      checked={values.updates}
      on:check={(e) => edit("updates", e.detail, "updates")}
    />

    <p role="status">{status || "Nothing undone yet."}</p>
  </Stack>
</div>
