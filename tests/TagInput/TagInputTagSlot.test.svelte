<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagInput from "carbon-components-svelte/TagInput/TagInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = ["locked", "urgent", "later"];
  export let tagPlacement: ComponentProps<TagInput>["tagPlacement"] = "inline";
</script>

<TagInput labelText="Topics" {tagPlacement} bind:value>
  <svelte:fragment slot="tag" let:tag let:index let:props>
    <Tag
      {...props}
      filter={props.filter && tag !== "locked"}
      type={tag === "urgent" ? "red" : "gray"}
      data-index={index}
    >
      {tag}
    </Tag>
  </svelte:fragment>
</TagInput>

<div data-testid="value">{JSON.stringify(value)}</div>
