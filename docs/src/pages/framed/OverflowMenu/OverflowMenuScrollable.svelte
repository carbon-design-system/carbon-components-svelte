<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  const workspaces = [
    "Platform API",
    "Billing Service",
    "Customer Portal",
    "Admin Console",
    "Data Pipeline",
    "Analytics Warehouse",
    "Notification Service",
    "Identity & Access",
    "Payments Gateway",
    "Support Desk",
    "Audit & Compliance",
    "Mobile Backend",
    "Search Service",
    "Reporting Engine",
    "Webhook Relay",
    "File Storage",
    "Message Queue",
    "Feature Flags",
    "Monitoring Stack",
    "Incident Response",
  ];
</script>

<OverflowMenu maxHeight={240}>
  {#each workspaces as workspace (workspace)}
    <OverflowMenuItem text={workspace} />
  {/each}
  <OverflowMenuItem hasDivider danger text="Delete service" />
</OverflowMenu>
