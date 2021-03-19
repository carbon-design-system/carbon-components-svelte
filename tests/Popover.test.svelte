<script lang="ts">
  import { Popover } from "../types";

  let open = false;
</script>

<Popover
  bind:open
  closeOnOutsideClick
  align="right"
  caret
  relative
  light
  highContrast
  on:click:outside="{() => {
    console.log('on:click:outside');
  }}"
>
  <div style="padding: var(--cds-spacing-05)">Content</div>
</Popover>
