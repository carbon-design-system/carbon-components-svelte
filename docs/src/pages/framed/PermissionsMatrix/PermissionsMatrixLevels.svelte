<script>
  import { PermissionsMatrix } from "carbon-components-svelte";

  const levels = [
    { id: "none", label: "No access" },
    { id: "read", label: "Read" },
    { id: "write", label: "Write" },
    { id: "admin", label: "Admin" },
  ];

  const roles = [
    { id: "everyone", label: "Everyone" },
    { id: "developers", label: "Developers", parent: "everyone" },
    { id: "platform", label: "Platform team", parent: "developers" },
  ];

  const permissions = [
    {
      id: "repos",
      label: "Repositories",
      children: [
        { id: "repos.code", label: "Code" },
        { id: "repos.issues", label: "Issues" },
        { id: "repos.settings", label: "Settings" },
      ],
    },
    {
      id: "pipelines",
      label: "Pipelines",
      children: [
        { id: "pipelines.runs", label: "Runs" },
        { id: "pipelines.secrets", label: "Secrets" },
      ],
    },
  ];

  let value = {
    everyone: { "repos.code": "read", "repos.issues": "read" },
    developers: { "repos.code": "write", "pipelines.runs": "write" },
    platform: { "repos.settings": "admin", "pipelines.secrets": "write" },
  };
</script>

<PermissionsMatrix
  bind:value
  labelText="Team access"
  {levels}
  {roles}
  {permissions}
  height={400}
/>
