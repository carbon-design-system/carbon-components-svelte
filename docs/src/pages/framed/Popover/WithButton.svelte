<script>
  import { Popover, PopoverContent, Button } from "carbon-components-svelte";

  let open = true;
  let ref = null;
</script>

<div bind:this="{ref}">
  <Popover
    bind:open
    isTabTip
    on:click:outside="{({ detail }) => {
      console.log('on:click:outside');
      open = ref.contains(detail.target);
    }}"
  >
    <Button on:click="{() => (open = !open)}">Toggle popover</Button>
    <PopoverContent className="p-05">Content</PopoverContent>
  </Popover>
</div>
