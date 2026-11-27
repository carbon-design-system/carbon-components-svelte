<script>
  import { TokenSearch, UserAvatar } from "carbon-components-svelte";

  const keys = [
    {
      key: "author",
      type: "user",
      values: [
        { value: "praman", label: "Priya Raman", description: "@praman" },
        {
          value: "moyelaran",
          label: "Marcus Oyelaran",
          description: "@moyelaran",
        },
        { value: "wzhang", label: "Wei Zhang", description: "@wzhang" },
      ],
    },
  ];

  let value = "author:";
</script>

<TokenSearch bind:value {keys} labelText="Search issues">
  <svelte:fragment let:item>
    {#if item.kind === "value"}
      <UserAvatar size="sm" name={item.text} backgroundColor="auto" />
    {/if}
    <span class="bx--token-search__text">{item.text}</span>
    {#if item.secondary}
      <span class="bx--token-search__secondary">{item.secondary}</span>
    {/if}
  </svelte:fragment>
</TokenSearch>
