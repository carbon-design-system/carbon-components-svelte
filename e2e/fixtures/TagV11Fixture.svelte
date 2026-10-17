<script>
  import {
    OperationalTag,
    SelectableTag,
    Tag,
    TagInput,
    TagSet,
    TagSkeleton,
  } from "carbon-components-svelte";
  import IbmCloud from "carbon-icons-svelte/lib/IbmCloud.svelte";

  const long =
    "status:active AND region:us-south AND service:cloud-object-storage";
  const regions = ["us-south", "us-east", "eu-de", "eu-gb", "jp-tok"];
</script>

<div data-testid="long">
  <Tag data-testid="long-static" type="blue">{long}</Tag>
  <Tag data-testid="long-filter" filter>{long}</Tag>
  <Tag data-testid="long-interactive" interactive>{long}</Tag>
  <OperationalTag data-testid="long-operational">{long}</OperationalTag>
  <SelectableTag data-testid="long-selectable">{long}</SelectableTag>
  <Tag data-testid="long-fit" maxWidth="100%">{long}</Tag>
</div>

<div data-testid="states">
  <Tag data-testid="interactive" interactive type="blue">Machine learning</Tag>
  <OperationalTag data-testid="operational" type="red"
    >3 policies</OperationalTag
  >
  <OperationalTag data-testid="operational-disabled" type="red" disabled>
    3 policies
  </OperationalTag>
  <SelectableTag data-testid="selectable">Compliant</SelectableTag>
  <SelectableTag data-testid="selectable-disabled" disabled>
    Compliant
  </SelectableTag>
  <Tag data-testid="icon" icon={IbmCloud}>IBM Cloud</Tag>
  <Tag data-testid="icon-lg" icon={IbmCloud} size="lg">IBM Cloud</Tag>
  <Tag data-testid="plain">IBM Cloud</Tag>
  <Tag data-testid="filter" filter>us-south</Tag>
</div>

<div data-testid="set-container" style="width: 360px">
  <TagSet>
    {#each regions as region (region)}
      <Tag filter value={region}>{region}: {long}</Tag>
    {/each}
  </TagSet>
</div>

<div data-testid="margins">
  {#each ["xs", "sm", "default", "lg"] as size (size)}
    <Tag {size}>Static</Tag>
    <Tag {size} filter>Filter</Tag>
    <Tag {size} interactive>Interactive</Tag>
    <Tag {size} href="#tag">Link</Tag>
    <Tag {size} inline>Inline</Tag>
    <OperationalTag {size}>Operational</OperationalTag>
    <SelectableTag {size}>Selectable</SelectableTag>
    <TagSkeleton {size} />
  {/each}
</div>

<div data-testid="short-set" style="width: 480px">
  <TagSet>
    {#each regions as region (region)}
      <Tag filter value={region}>{region}</Tag>
    {/each}
  </TagSet>
</div>

<div data-testid="tag-input" style="width: 480px">
  <TagInput labelText="Regions" value={regions} />
</div>
