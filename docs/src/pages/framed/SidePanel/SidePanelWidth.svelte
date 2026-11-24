<script>
  import {
    Button,
    CodeSnippet,
    Content,
    Header,
    SidePanel,
  } from "carbon-components-svelte";

  let open = true;

  const code = `# Deploy checkout-api to US East on the Standard plan, with three replicas
ibmcloud ce application update --name checkout-api --min-scale 3 --max-scale 6
ibmcloud ce application get --name checkout-api --output json | jq .status`;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button on:click={() => (open = true)}>View deploy script</Button>
</Content>

<SidePanel bind:open width={736} titleText="Deploy script">
  <CodeSnippet type="multi" {code} />
</SidePanel>
