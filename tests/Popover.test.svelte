<script lang="ts">
  import { Popover, PopoverContent } from "../types";

  let open = false;
</script>

<Popover
  bind:open
  closeOnOutsideClick
  align="right"
  caret
  highContrast
  on:click:outside="{() => {
    console.log('on:click:outside');
  }}"
>
  <PopoverContent style="padding: var(--bx-spacing-05)">Content</PopoverContent>
</Popover>
