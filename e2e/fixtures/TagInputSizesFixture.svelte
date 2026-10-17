<script>
  import { TagInput, TextInput } from "carbon-components-svelte";

  const sizes = ["xs", "sm", undefined, "xl"];
</script>

{#each sizes as size (size ?? "md")}
  <div data-size={size ?? "md"} style="width: 20rem">
    <TagInput {size} labelText="Topics" placeholder="Add a topic" />
    <TextInput {size} labelText="Name" placeholder="Name" />
  </div>
{/each}

{#each sizes as size (size ?? "md")}
  <div data-narrow={size ?? "md"} style="width: 12rem">
    <TagInput {size} labelText="Topics" value={["billing"]} />
    <TextInput {size} labelText="Name" />
  </div>
{/each}

<!-- Fields of several widths, with one tag, three tags, and a long one. -->
{#each [192, 240, 320] as width (width)}
  <div data-width={width} style="width: {width}px">
    <TagInput labelText="One tag {width}" value={["billing"]} />
    <TagInput
      labelText="Three tags {width}"
      value={["billing", "shipping", "refunds"]}
    />
    <TagInput
      labelText="Long tag {width}"
      value={["Datenschutzgrundverordnungskonformitätsprüfung"]}
    />
    <TagInput
      labelText="Placeholder {width}"
      value={["billing"]}
      placeholder="Add a topic"
    />
  </div>
{/each}
