<svelte:options accessors />

<script lang="ts">
  import PermissionsMatrix from "carbon-components-svelte/PermissionsMatrix/PermissionsMatrix.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<PermissionsMatrix>;

  export let roles: Props["roles"] = [
    { id: "viewer", label: "Viewer" },
    { id: "editor", label: "Editor", parent: "viewer" },
    { id: "admin", label: "Admin", parent: "editor" },
  ];
  export let permissions: Props["permissions"] = [
    {
      id: "billing",
      label: "Billing",
      children: [
        { id: "billing.view", label: "View invoices" },
        { id: "billing.pay", label: "Pay invoices" },
      ],
    },
    {
      id: "team",
      label: "Team",
      children: [
        { id: "team.view", label: "View members" },
        { id: "team.invite", label: "Invite members" },
      ],
    },
    { id: "audit", label: "Audit log" },
  ];
  export let value: Props["value"] = {
    viewer: { "billing.view": true, "team.view": true },
    editor: { "billing.pay": true },
  };
  export let saved: Props["saved"] = undefined;
  export let levels: Props["levels"] = undefined;
  export let transposed = false;
  export let virtualize = false;
  export let height = 480;
  export let size: Props["size"] = undefined;
  export let collapsedIds: Props["collapsedIds"] = [];
  export let lockReason: Props["lockReason"] = undefined;
  export let headerLayout: Props["headerLayout"] = "wrap";
  export let hold = false;
  export let events: string[] = [];
</script>

<PermissionsMatrix
  bind:value
  bind:saved
  bind:collapsedIds
  {roles}
  {permissions}
  {levels}
  {transposed}
  {virtualize}
  {height}
  {size}
  {lockReason}
  {headerLayout}
  labelText="Role permissions"
  on:change={(event) =>
    (events = [...events, `change:${event.detail.edits.length}`])}
  on:save={(event) => {
    events = [...events, `save:${event.detail.changes.length}`];
    if (hold) event.preventDefault();
  }}
  on:discard={() => (events = [...events, "discard"])}
/>
<pre data-testid="value">{JSON.stringify(value)}</pre>
