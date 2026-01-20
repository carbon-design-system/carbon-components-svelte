<script>
  import {
    Button,
    Column,
    Content,
    Grid,
    Header,
    HeaderSearch,
    HeaderUtilities,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";

  const data = [
    {
      href: "/",
      text: "Kubernetes Service",
      description:
        "Deploy secure, highly available apps in a native Kubernetes experience. IBM Cloud Kubernetes Service creates a cluster of compute hosts and deploys highly available containers.",
    },
    {
      href: "/",
      text: "Red Hat OpenShift on IBM Cloud",
      description:
        "Deploy and secure enterprise workloads on native OpenShift with developer focused tools to run highly available apps. OpenShift clusters build on Kubernetes container orchestration that offers consistency and flexibility in operations.",
    },
    {
      href: "/",
      text: "Container Registry",
      description:
        "Securely store container images and monitor their vulnerabilities in a private registry.",
    },
    {
      href: "/",
      text: "Code Engine",
      description:
        "Run your application, job, or container on a managed serverless platform.",
    },
  ];

  let ref = null;
  let active = false;
  let value = "";
  let selectedResultIndex = 0;
  let events = [];

  $: lowerCaseValue = value.toLowerCase();
  $: results =
    value.length > 0
      ? data.filter((item) => {
          return (
            item.text.toLowerCase().includes(lowerCaseValue) ||
            item.description.includes(lowerCaseValue)
          );
        })
      : [];

  $: console.log("ref", ref);
  $: console.log("active", active);
  $: console.log("value", value);
  $: console.log("selectedResultIndex", selectedResultIndex);
</script>

<Header companyName="IBM" platformName="Carbon Svelte">
  <svelte:fragment slot="skipToContent">
    <SkipToContent />
  </svelte:fragment>
  <HeaderUtilities>
    <HeaderSearch
      bind:ref
      bind:active
      bind:value
      bind:selectedResultIndex
      placeholder="Search services"
      {results}
      on:active={() => {
        events = [...events, { type: "active" }];
      }}
      on:inactive={() => {
        events = [...events, { type: "inactive" }];
      }}
      on:clear={() => {
        events = [...events, { type: "clear" }];
      }}
      on:select={(e) => {
        events = [...events, { type: "select", ...e.detail }];
      }}
    />
  </HeaderUtilities>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>HeaderSearch</h1>
        <Button
          on:click={() => {
            active = true;
          }}
        >
          Activate the search bar
        </Button>
        <h2>Reactive values</h2>
        <p><strong>active</strong>: {active}</p>
        <p><strong>value</strong>: {value}</p>
        <p><strong>selectedResultIndex</strong>: {selectedResultIndex}</p>
        <h2>Events</h2>
        <p>
          Click the button and search for something. Dispatched events are
          logged below:
        </p>
        <div style:overflow-x="auto">
          {#each events as { type, ...rest }}
            <div style:margin-bottom="var(--cds-layout-01)">
              <div><strong>on:{type}</strong></div>
              {#if Object.keys(rest).length > 0}
                <pre>{JSON.stringify(rest, null, 2)}</pre>
              {/if}
            </div>
          {/each}
        </div>
      </Column>
    </Row>
  </Grid>
</Content>
