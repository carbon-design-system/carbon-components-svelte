<script lang="ts">
  import DescriptionList from "carbon-components-svelte/DescriptionList/DescriptionList.svelte";
  import DescriptionListItem from "carbon-components-svelte/DescriptionList/DescriptionListItem.svelte";
</script>

<DescriptionList data-testid="default">
  <DescriptionListItem term="Name">PostgreSQL</DescriptionListItem>
  <DescriptionListItem term="Type">Relational</DescriptionListItem>
</DescriptionList>

<DescriptionList data-testid="horizontal" layout="horizontal">
  <DescriptionListItem term="Name">MongoDB</DescriptionListItem>
</DescriptionList>

<DescriptionList data-testid="columns" columns={2}>
  <DescriptionListItem term="A">1</DescriptionListItem>
  <DescriptionListItem term="B">2</DescriptionListItem>
</DescriptionList>

<DescriptionList data-testid="custom-gap" gap="22px" class="custom">
  <DescriptionListItem term="C">3</DescriptionListItem>
</DescriptionList>

<DescriptionList data-testid="empty-term">
  <DescriptionListItem>No term</DescriptionListItem>
</DescriptionList>
