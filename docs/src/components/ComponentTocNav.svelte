<script lang="ts">
  import { Text } from "carbon-components-svelte";

  export let headings: { id: string; text: string; depth: number }[] = [];

  const API_LINKS = [
    { id: "component-api-props", text: "Props" },
    { id: "component-api-typedefs", text: "Typedefs" },
    { id: "component-api-slots", text: "Slots" },
    { id: "component-api-forwarded-events", text: "Forwarded events" },
    { id: "component-api-dispatched-events", text: "Dispatched events" },
    { id: "component-api-rest-props", text: "restProps" },
  ];
</script>

<Text tag="h5" type="label-01" color="primary" class="toc-section-label">
  Examples
</Text>
<nav class="toc-nav">
  {#each headings as heading}
    <a
      class={heading.depth === 3
        ? "bx--link toc-nav__sub bx--type-label-01"
        : "bx--link"}
      href="#{heading.id}">{heading.text}</a
    >
  {/each}
  <div class="toc-section-label bx--type-label-01 bx--type-text-primary">
    Component API
  </div>
  {#each API_LINKS as link}
    <a class="bx--link" href="#{link.id}">{link.text}</a>
  {/each}
</nav>
