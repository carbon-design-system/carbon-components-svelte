<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Select from './Select.svelte';
  import SelectItem from './SelectItem.svelte';
  import SelectSkeleton from './Select.Skeleton.svelte';
  import SelectItemGroup from './SelectItemGroup.svelte';

  let selected = 'placeholder-item';
</script>

<Layout>
  <div>
    {selected}
    {#if story === 'skeleton'}
      <SelectSkeleton {...$$props} />
    {:else}
      <Select {...$$props.select} id="select-1" bind:selected>
        <SelectItem value="placeholder-item" text="Choose an option" disabled hidden />
        <SelectItemGroup {...$$props.group} label="Category 1">
          <SelectItem value="option-1" text="Option 1" />
          <SelectItem value="option-2" text="Option 2" />
        </SelectItemGroup>
        <SelectItemGroup {...$$props.group} label="Category 2">
          <SelectItem value="option-3" text="Option 3" />
          <SelectItem value="option-4" text="Option 4" />
        </SelectItemGroup>
      </Select>
    {/if}
  </div>
</Layout>
