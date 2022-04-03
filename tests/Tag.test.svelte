<script lang="ts">
  import { Tag } from "../types";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Tag class="my-class" style="margin: 1rem;">IBM Cloud</Tag>

<Tag type="red">red</Tag>

<Tag type="magenta">magenta</Tag>

<Tag type="purple">purple</Tag>

<Tag type="blue">blue</Tag>

<Tag type="cyan">cyan</Tag>

<Tag type="teal">teal</Tag>

<Tag type="green">green</Tag>

<Tag type="gray">gray</Tag>

<Tag type="cool-gray">cool-gray</Tag>

<Tag type="warm-gray">warm-gray</Tag>

<Tag type="high-contrast">high-contrast</Tag>

<Tag type="outline">outline</Tag>

<Tag filter on:click on:close>Filterable</Tag>

<Tag icon="{Add}">Custom icon</Tag>

<Tag interactive>Text</Tag>

<Tag skeleton />
