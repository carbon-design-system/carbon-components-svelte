<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    {
      text: "Status page",
      href: "https://status.example.com/",
      target: "_blank",
    },
    {
      text: "Internal wiki",
      href: "https://wiki.example.com/",
      rel: "nofollow",
    },
  ];
</script>

<RecursiveList {nodes} />
