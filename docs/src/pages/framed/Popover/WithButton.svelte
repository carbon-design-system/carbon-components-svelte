<script>
  import { Popover, Button } from "carbon-components-svelte";

  let open = true;
  let containerRef = null;
</script>

<div data-outline>
  <div
    bind:this="{containerRef}"
    style:position="relative"
    style:display="inline-block"
  >
    <Button on:click="{() => (open = !open)}">Click to open</Button>
    <Popover
      bind:open
      align="bottom-left"
      on:click:outside="{({ detail }) => {
        console.log('on:click:outside');
        if (!containerRef.contains(detail.target)) {
          open = false;
        }
      }}"
    >
      <div style="padding: var(--cds-spacing-05)">Content</div>
    </Popover>
  </div>
  <div>
    <br />
    Anim eu laboris veniam in est elit ullamco enim irure id. Lorem est culpa ex
    in enim enim. Culpa quis incididunt magna officia et aliqua. Ullamco deserunt
    aute enim cupidatat. Culpa quis enim sint sint anim qui irure exercitation labore
    occaecat in reprehenderit proident. Nisi laborum ut et amet commodo amet ullamco
    commodo non aliqua magna ad eu. Ad aliquip minim nostrud id enim elit velit ullamco
    pariatur eu excepteur pariatur cillum.
  </div>
</div>
