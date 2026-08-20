<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    {
      text: "Opens in a new tab",
      href: "https://svelte.dev/",
      target: "_blank",
    },
    {
      text: "Custom rel",
      href: "https://svelte.dev/",
      rel: "nofollow",
    },
  ];
</script>

<RecursiveList {nodes} />
