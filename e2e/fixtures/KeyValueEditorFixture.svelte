<script>
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import KeyValueEditor from "carbon-components-svelte/KeyValueEditor/KeyValueEditor.svelte";
  import { rowsFromFormData } from "carbon-components-svelte/KeyValueEditor/rows.js";

  let env = [
    { key: "NODE_ENV", value: "production", scope: "prod" },
    { key: "DATABASE_URL", value: "postgres://db.internal/app", secret: true },
    { key: "API_TOKEN", value: "", secret: true, stored: true },
    { key: "DEBUG", value: "1", enabled: false, scope: "preview" },
  ];
  let headers = [
    { key: "Accept", value: "application/json" },
    { key: "Authorization", value: "Bearer abc123", secret: true },
  ];
  let labels = [
    { key: "app.kubernetes.io/name", value: "web" },
    { key: "tier", value: "frontend" },
  ];

  let envEditor;
  let submitted = "";
  let valid = true;

  /** @param {SubmitEvent} event */
  function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(/** @type {HTMLFormElement} */ (event.target));
    submitted = JSON.stringify({
      env: rowsFromFormData(data, "env"),
      headers: rowsFromFormData(data, "headers"),
      labels: rowsFromFormData(data, "labels"),
    });
  }

  /** @param {{ key: string; value: string }} row */
  function validateLabel(row) {
    if (row.value.length > 63) return { value: "Use 63 characters or fewer." };
  }
</script>

<form on:submit={onSubmit} data-testid="form">
  <KeyValueEditor
    bind:this={envEditor}
    bind:rows={env}
    bind:valid
    id="env"
    name="env"
    format="env"
    labelText="Environment variables"
    helperText="Secrets are hidden after you save them."
    columns={["enabled", "secret", "scope", "description"]}
    scopes={[
      { id: "", text: "All environments" },
      { id: "prod", text: "Production" },
      { id: "preview", text: "Preview" },
      { id: "dev", text: "Development" },
    ]}
    maxKeyLength={255}
  />

  <div style="margin-top: 3rem">
    <KeyValueEditor
      bind:rows={headers}
      id="headers"
      name="headers"
      format="headers"
      labelText="Request headers"
      addMode="ghost"
      duplicateKeys="warn"
      columns={["enabled"]}
    />
  </div>

  <div style="margin-top: 3rem">
    <KeyValueEditor
      bind:rows={labels}
      id="labels"
      name="labels"
      format="plain"
      labelText="Labels"
      bulkEdit={false}
      validate={validateLabel}
      size="sm"
    />
  </div>

  <div style="margin-top: 2rem; display: flex; gap: 1rem">
    <Button type="submit">Save</Button>
    <Button kind="secondary" type="reset">Reset</Button>
  </div>
</form>

<pre data-testid="submitted">{submitted}</pre>
<p data-testid="valid">{valid ? "valid" : "invalid"}</p>
