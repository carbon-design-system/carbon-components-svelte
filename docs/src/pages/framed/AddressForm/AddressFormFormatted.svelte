<script>
  import {
    DescriptionList,
    DescriptionListItem,
    formatAddress,
    Stack,
  } from "carbon-components-svelte";

  const addresses = [
    {
      title: "Cupertino",
      value: {
        country: "US",
        name: "Jane Doe",
        lines: ["1 Infinite Loop"],
        locality: "Cupertino",
        region: "CA",
        postalCode: "95014",
      },
    },
    {
      title: "Tokyo",
      value: {
        country: "JP",
        name: "山田 太郎",
        lines: ["神宮前1-2-3"],
        locality: "渋谷区",
        region: "東京都",
        postalCode: "150-0001",
      },
    },
    {
      title: "São Paulo",
      value: {
        country: "BR",
        lines: ["Av. Paulista, 1578"],
        dependentLocality: "Bela Vista",
        locality: "São Paulo",
        region: "SP",
        postalCode: "01310-200",
      },
    },
  ];
</script>

<Stack gap={6}>
  <DescriptionList>
    {#each addresses as { title, value }}
      <DescriptionListItem term={title}>
        <address>
          {#each formatAddress(value) as line}
            {line}<br />
          {/each}
        </address>
      </DescriptionListItem>
    {/each}
  </DescriptionList>
</Stack>
