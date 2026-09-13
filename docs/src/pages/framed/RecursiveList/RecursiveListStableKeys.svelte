<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    { id: "overview", text: "Overview" },
    {
      id: "admin-guide",
      text: "Admin guide",
      nodes: [{ id: "admin-guide-sso", text: "Configure SSO" }],
    },
    { id: "api", text: "API reference" },
  ];
</script>

<RecursiveList {nodes} />
