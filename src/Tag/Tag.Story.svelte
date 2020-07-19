<script>
  export let slot = undefined;
  export let story = undefined;

  import Tag from "./Tag.svelte";
  import TagSkeleton from "./Tag.Skeleton.svelte";
</script>

<div>
  {#if story === 'filter'}
    <Tag
      {...$$restProps}
      on:click={() => {
        console.log('click');
      }}>
      {slot}
    </Tag>
  {:else if story === 'skeleton'}
    <TagSkeleton />
  {:else}
    <Tag {...$$restProps} class="class">{slot}</Tag>
  {/if}
</div>
