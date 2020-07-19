<script>
  export let disabled = undefined;
  export let filter = undefined;
  export let slot = undefined;
  export let story = undefined;
  export let type = undefined;

  import Tag from "./Tag.svelte";
  import TagSkeleton from "./Tag.Skeleton.svelte";
</script>

<div>
  {#if story === 'filter'}
    <Tag
      {filter}
      on:click={() => {
        console.log('click');
      }}>
      {slot}
    </Tag>
  {:else if story === 'skeleton'}
    <TagSkeleton />
  {:else}
    <Tag {disabled} {type} class="class">{slot}</Tag>
  {/if}
</div>
