<script>
  import {
    Header,
    HeaderSearch,
    HeaderUtilities,
    SkipToContent,
  } from "carbon-components-svelte";
  import ImageSearchAlt from "carbon-icons-svelte/lib/ImageSearchAlt.svelte";

  const data = [
    { id: "kubernetes-service", href: "/", text: "Kubernetes Service" },
    { id: "code-engine", href: "/", text: "Code Engine" },
    { id: "container-registry", href: "/", text: "Container Registry" },
  ];

  let value = "";

  $: results =
    value.length > 0
      ? data.filter((item) =>
          item.text.toLowerCase().includes(value.toLowerCase()),
        )
      : [];
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderSearch
      bind:value
      icon={ImageSearchAlt}
      placeholder="Search secure services"
      labelText="Search secure services"
      closeButtonLabelText="Clear the search query"
      {results}
    />
  </HeaderUtilities>
</Header>
