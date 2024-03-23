<script>
  import { Popover, PopoverContent, Button } from "carbon-components-svelte";

  let open = true;
  let ref = null;
</script>

<div bind:this="{ref}" style:position="relative">
  <div
    data-outline
    style="width:100%;padding:4em 0 1em 0;display:flex;align-items:center;flex-direction:column;"
  >
    <Popover
      bind:open="{open}"
      align="bottom-left"
      caret
      on:click:outside="{({ detail }) => {
        console.log('on:click:outside');
        open = ref.contains(detail.target);
      }}"
    >
      <Button on:click="{() => (open = !open)}">Toggle popover</Button>
      <PopoverContent>
        <div style="padding:0.5em;">
          <h6>Available storage</h6>
          <p>This server has 150 GB of block storage remaining.</p>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</div>
