<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  const certifications = [
    { label: "SOC 2", type: "red" },
    { label: "HIPAA", type: "blue" },
    { label: "GDPR", type: "purple" },
    { label: "PCI DSS", type: "green" },
    { label: "ISO 27001", type: "magenta" },
    { label: "FedRAMP", type: "cyan" },
  ];
</script>

<div style="max-width: 12rem;">
  <TagSet>
    {#each certifications as certification}
      <Tag type={certification.type}>{certification.label}</Tag>
    {/each}
    <svelte:fragment slot="overflowTooltip" let:tags let:count>
      <strong>{count} more:</strong>&nbsp;{tags
        .map((tag) => tag.label)
        .join(", ")}
    </svelte:fragment>
  </TagSet>
</div>
