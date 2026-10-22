<script>
  import {
    OperationalTag,
    SelectableTag,
    Tag,
    TagSet,
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
