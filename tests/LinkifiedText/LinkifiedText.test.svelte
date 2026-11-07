<script lang="ts">
  import LinkifiedText from "carbon-components-svelte/LinkifiedText/LinkifiedText.svelte";

  export let text = "";
  export let protocols: string[] | undefined = undefined;
  export let emails = true;
  export let target: "_blank" | undefined = undefined;
  export let rel: string | undefined = undefined;
  export let dir: "rtl" | "ltr" | "auto" | undefined = undefined;
</script>

<p data-testid="host">
  <LinkifiedText
    data-testid="text"
    {text}
    {dir}
    {...protocols ? { protocols } : {}}
    {...rel === undefined ? {} : { rel }}
    {emails}
    {target}
  />
</p>
