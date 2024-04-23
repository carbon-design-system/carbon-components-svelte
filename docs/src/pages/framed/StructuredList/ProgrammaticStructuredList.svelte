<script>
  import {
    StructuredList,
    StructuredListBody,
    StructuredListHead,
    StructuredListCell,
    StructuredListRow,
    StructuredListInput,
  } from "carbon-components-svelte";

  const rows = [
    { value: "Application services", description: "IBM Consulting delivers high-quality and innovative IT solutions to meet our client’s business needs, including hybrid cloud management services with technology solutions that enable their business objectives and accelerate the cloud journey, unleashing the full potential of their technology investments." },
    { value: "Cloud services", description: "Drive agility and fuel growth with hybrid cloud and AI." },
    { value: "Data services", description: "Data is the fuel for the modern enterprise, and with data collection exploding, companies are increasing their investments in data integration in order to deliver rich digital experiences and actionable insights across their business." },
  ];

  let selected = rows[0].value;

  $: console.log("selected", selected);
</script>

<StructuredList selection bind:selected="{selected}">
  <StructuredListHead>
    <StructuredListRow>
      <StructuredListCell>Service</StructuredListCell>
      <StructuredListCell>Description</StructuredListCell>
      <StructuredListCell />
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each rows as row (row.value)}
      {@const selected =row.value === selected}
      <StructuredListRow tag="label" selected={selected}>
        <StructuredListCell>{row.value}</StructuredListCell>
        <StructuredListCell>{row.description}</StructuredListCell>
        <StructuredListInput
          value="{row.value}"
          id="{row.value}"
          name="{row.value}"
        />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
