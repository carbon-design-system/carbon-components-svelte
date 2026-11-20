<script lang="ts">
  import { PermissionsMatrix } from "carbon-components-svelte";

  // Query flags run the same suite in each mode: `levels`, `transposed`,
  // `rotated`, `virtualize` and `size`. `stress` builds 50 roles and 300
  // permissions.
  const params = new URLSearchParams(location.search);
  const stress = params.has("stress");
  const levels = params.has("levels")
    ? ["none", "read", "write", "admin"]
    : undefined;

  const resources = [
    "Billing",
    "Team",
    "Projects",
    "Deployments",
    "Secrets",
    "Audit",
  ];
  const actions = ["View", "Create", "Update", "Delete"];

  const roles = stress
    ? Array.from({ length: Number(params.get("roles") ?? 50) }, (_, i) => ({
        id: `role-${i}`,
        label: `Role ${i}`,
        parent: i % 5 === 0 ? null : `role-${i - 1}`,
      }))
    : [
        { id: "viewer", label: "Viewer" },
        { id: "editor", label: "Editor", parent: "viewer" },
        { id: "admin", label: "Administrator", parent: "editor" },
        { id: "billing", label: "Billing manager" },
        { id: "auditor", label: "Auditor" },
        { id: "owner", label: "Owner", locked: "The owner keeps every right" },
      ];

  const permissions = stress
    ? Array.from({ length: 30 }, (_, g) => ({
        id: `group-${g}`,
        label: `Resource ${g}`,
        children: Array.from({ length: 10 }, (_, a) => ({
          id: `perm-${g}-${a}`,
          label: `Action ${a}`,
        })),
      }))
    : [
        ...resources.map((resource) => ({
          id: resource.toLowerCase(),
          label: resource,
          children: actions.map((action) => ({
            id: `${resource.toLowerCase()}.${action.toLowerCase()}`,
            label: `${action} ${resource.toLowerCase()}`,
          })),
        })),
      ];

  const grant = levels ? "read" : true;
  const wide = levels ? "write" : true;
  let value = stress
    ? Object.fromEntries(
        roles.map((role, r) => [
          role.id,
          Object.fromEntries(
            permissions.flatMap((group, g) =>
              group.children
                .filter((_, a) => (r + g + a) % 3 === 0)
                .map((child) => [child.id, grant]),
            ),
          ),
        ]),
      )
    : {
        viewer: {
          "billing.view": grant,
          "team.view": grant,
          "projects.view": grant,
        },
        editor: { "projects.create": wide, "projects.update": wide },
        admin: {
          "projects.delete": wide,
          "team.view": levels ? "none" : false,
        },
        billing: { "billing.view": wide, "billing.update": wide },
        owner: Object.fromEntries(
          permissions.flatMap((group) =>
            group.children.map((child) => [child.id, levels ? "admin" : true]),
          ),
        ),
      };

  function lockReason(role: { id: string }, permission: { id: string }) {
    return role.id === "auditor" && permission.id.startsWith("secrets")
      ? "Auditors cannot reach secrets under SOC 2"
      : undefined;
  }

  let collapsedIds: string[] = [];
  let events: string[] = [];
</script>

<div data-testid="matrix">
  <PermissionsMatrix
    bind:value
    bind:collapsedIds
    labelText="Role permissions"
    {roles}
    {permissions}
    {levels}
    {lockReason}
    transposed={params.has("transposed")}
    headerLayout={params.has("rotated") ? "rotated" : "wrap"}
    virtualize={!params.has("novirtual") &&
      (params.has("virtualize") || stress)}
    size={(params.get("size") as "compact" | "short" | undefined) ??
      (stress ? "short" : undefined)}
    height={Number(params.get("height") ?? 420)}
    on:change={(event) =>
      (events = [...events, `change:${event.detail.edits.length}`])}
    on:save={(event) =>
      (events = [...events, `save:${event.detail.changes.length}`])}
  />
</div>
<div data-testid="events" style="overflow-wrap: anywhere">
  {events.join(",")}
</div>
<div data-testid="value" style="overflow-wrap: anywhere">
  {JSON.stringify(value)}
</div>
