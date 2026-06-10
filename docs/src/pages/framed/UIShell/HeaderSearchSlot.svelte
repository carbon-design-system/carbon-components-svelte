<script>
  import {
    Content,
    Header,
    HeaderSearch,
    HeaderUtilities,
    SkipToContent,
  } from "carbon-components-svelte";

  const data = [
    {
      id: "kubernetes-service",
      href: "/",
      text: "Kubernetes Service",
      description: "Deploy secure, highly available apps.",
    },
    {
      id: "red-hat-openshift",
      href: "/",
      text: "Red Hat OpenShift on IBM Cloud",
      description: "Deploy and secure enterprise workloads.",
    },
    {
      id: "container-registry",
      href: "/",
      text: "Container Registry",
      description: "Securely store container images.",
    },
  ];

  let active = false;
  let value = "";
  let selectedResultIndex = 0;

  $: lowerCaseValue = value.toLowerCase();
  $: results =
    value.length > 0
      ? data.filter((item) => item.text.toLowerCase().includes(lowerCaseValue))
      : [];
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderSearch
      bind:active
      bind:value
      bind:selectedResultIndex
      placeholder="Search services"
      {results}
      let:result
      let:selected
    >
      <div>
        <strong>{result.text}</strong>
        {#if selected}
          <span>&nbsp;(selected)</span>
        {/if}
      </div>
      <div>{result.description}</div>
    </HeaderSearch>
  </HeaderUtilities>
</Header>

<Content>
  <p>Activate the search bar and type "service" to see custom results.</p>
</Content>
