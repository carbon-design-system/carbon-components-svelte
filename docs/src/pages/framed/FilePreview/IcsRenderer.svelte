<script>
  export let file;
  export let options;

  import {
    DescriptionList,
    DescriptionListItem,
  } from "carbon-components-svelte";
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();
  let fields = [];

  $: void options;

  onMount(async () => {
    const text = await file.blob.text();
    fields = text
      .split("\n")
      .filter((line) =>
        ["SUMMARY", "DTSTART", "LOCATION"].some((key) =>
          line.startsWith(`${key}:`),
        ),
      )
      .map((line) => line.split(/:(.*)/s).slice(0, 2));
    dispatch("ready");
  });
</script>

<DescriptionList>
  {#each fields as [term, detail] (term)}
    <DescriptionListItem {term}>{detail}</DescriptionListItem>
  {/each}
</DescriptionList>
