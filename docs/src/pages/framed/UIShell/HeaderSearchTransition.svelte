<script>
  import {
    Content,
    Header,
    HeaderSearch,
    HeaderUtilities,
    SkipToContent,
  } from "carbon-components-svelte";

  const data = [
    { id: "kubernetes", href: "/", text: "Kubernetes Service" },
    { id: "openshift", href: "/", text: "Red Hat OpenShift on IBM Cloud" },
    { id: "registry", href: "/", text: "Container Registry" },
    { id: "code-engine", href: "/", text: "Code Engine" },
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
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderUtilities>
    <HeaderSearch
      transition
      bind:value
      placeholder="Search services"
      {results}
    />
  </HeaderUtilities>
</Header>

<Content>
  <h1>HeaderSearch (menu transition)</h1>
  <p>
    Open the search and type "co". The results slide out when you clear the
    input, press Escape, or choose a result.
  </p>
</Content>
