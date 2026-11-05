<script>
  import { PermissionsMatrix } from "carbon-components-svelte";

  const roles = [
    { id: "viewer", label: "Viewer" },
    { id: "editor", label: "Editor", parent: "viewer" },
    { id: "admin", label: "Administrator", parent: "editor" },
  ];

  const permissions = [
    {
      id: "dashboards",
      label: "Dashboards",
      children: [
        { id: "dashboards.view", label: "View dashboards" },
        { id: "dashboards.edit", label: "Edit dashboards" },
        { id: "dashboards.share", label: "Share dashboards" },
      ],
    },
    {
      id: "alerts",
      label: "Alerts",
      children: [
        { id: "alerts.view", label: "View alerts" },
        { id: "alerts.silence", label: "Silence alerts" },
      ],
    },
  ];

  let value = {
    viewer: { "dashboards.view": true, "alerts.view": true },
    editor: { "dashboards.edit": true },
  };
  let saved = value;
  let status = "";

  async function save(event) {
    // Keep the changes pending until the request succeeds.
    event.preventDefault();
    const { value: snapshot, changes } = event.detail;
    status = "Saving...";
    await new Promise((resolve) => setTimeout(resolve, 800));
    saved = snapshot;
    status = `Saved ${changes.length} changes`;
  }
</script>

<PermissionsMatrix
  bind:value
  bind:saved
  labelText="Workspace roles"
  {roles}
  {permissions}
  height={360}
  on:save={save}
  on:discard={() => (status = "Discarded")}
/>
<p aria-live="polite">{status}</p>
