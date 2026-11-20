<script>
  import { PermissionsMatrix } from "carbon-components-svelte";

  const roles = Array.from({ length: 50 }, (_, i) => ({
    id: `role-${i}`,
    label: `Service role ${i + 1}`,
    parent: i % 5 === 0 ? null : `role-${i - 1}`,
  }));

  const permissions = Array.from({ length: 30 }, (_, group) => ({
    id: `service-${group}`,
    label: `Service ${group + 1}`,
    children: Array.from({ length: 10 }, (_, action) => ({
      id: `service-${group}.action-${action}`,
      label: `Action ${action + 1}`,
    })),
  }));

  let value = {
    "role-0": { "service-0.action-0": true, "service-1.action-0": true },
  };
</script>

<PermissionsMatrix
  bind:value
  virtualize
  size="short"
  height={480}
  labelText="Service roles"
  {roles}
  {permissions}
/>
