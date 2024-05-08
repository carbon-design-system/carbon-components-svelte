<script lang="ts">
  import { Popover, PopoverContent } from "../types";

  let open = false;
</script>

<Popover
  bind:open="{open}"
  closeOnOutsideClick
  align="right"
  caret
  light
  highContrast
  on:click:outside="{() => {
    console.log('on:click:outside');
  }}"
>
  <PopoverContent>Content</PopoverContent>
</Popover>
