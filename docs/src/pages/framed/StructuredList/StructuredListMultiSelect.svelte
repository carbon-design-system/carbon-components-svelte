<script>
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListInput,
    StructuredListRow,
  } from "carbon-components-svelte";
  import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";

  const databases = [
    {
      id: "postgresql",
      name: "PostgreSQL",
      type: "Relational",
      description:
        "Open-source object-relational database known for reliability, extensibility, and strong SQL standards compliance.",
    },
    {
      id: "mongodb",
      name: "MongoDB",
      type: "Document",
      description:
        "Document-oriented NoSQL database designed for flexible schemas and horizontal scaling across distributed clusters.",
    },
    {
      id: "redis",
      name: "Redis",
      type: "Key-value",
      description:
        "In-memory key-value store used as a cache, message broker, and real-time data platform with sub-millisecond latency.",
    },
  ];

  let selected = ["postgresql-value", "redis-value"];
</script>

<StructuredList selection multiple bind:selected>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Name</StructuredListCell>
      <StructuredListCell head>Type</StructuredListCell>
      <StructuredListCell head>Description</StructuredListCell>
      <StructuredListCell head>{""}</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each databases as db}
      <StructuredListRow label for="multi-{db.id}">
        <StructuredListCell>{db.name}</StructuredListCell>
        <StructuredListCell>{db.type}</StructuredListCell>
        <StructuredListCell>{db.description}</StructuredListCell>
        <StructuredListInput
          id="multi-{db.id}"
          value="{db.id}-value"
          title="{db.name} option"
        />
        <StructuredListCell>
          <CheckmarkFilled
            class="bx--structured-list-svg"
            aria-label="select an option"
            title="select an option"
          />
        </StructuredListCell>
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>

<div style="margin-top: 1rem;">
  Selected: <strong>{selected.join(", ") || "None"}</strong>
</div>
