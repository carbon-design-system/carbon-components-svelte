<script lang="ts">
  /** The page's h2/h3 headings, as `tocHeadings` in `docs/scripts/toc-headings.ts` scrapes them. */
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

<nav class="toc-nav">
  {#each headings as heading}
    <a
      class={heading.depth === 3
        ? "bx--link toc-nav__sub bx--type-label-01"
        : "bx--link"}
      href="#{heading.id}"
      >{heading.text}</a
    >
  {/each}
  <div class="toc-section-label bx--type-label-01 bx--type-text-primary">
    Component API
  </div>
  {#each API_LINKS as link}
    <a class="bx--link" href="#{link.id}">{link.text}</a>
  {/each}
</nav>
