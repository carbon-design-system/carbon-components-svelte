<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    {
      text: "Infrastructure",
      nodes: [
        {
          text: "Deployment runbooks",
          nodes: [{ html: "<h5>Last updated: Q3 2026</h5>" }],
        },
      ],
    },
    {
      text: "Incident response",
      nodes: [
        {
          href: "https://status.example.com/incidents",
        },
        {
          href: "https://status.example.com/incidents",
          text: "View incident history",
        },
      ],
    },
    {
      text: "Billing",
    },
  ];
</script>

<RecursiveList type="ordered-native" {nodes} />
