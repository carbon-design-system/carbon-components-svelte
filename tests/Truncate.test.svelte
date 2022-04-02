<script lang="ts">
  import { Truncate } from "../types";
  import { truncate } from "../types";
</script>

<Truncate>
  Carbon Components Svelte is a Svelte component library that implements the
  Carbon Design System, an open source design system by IBM.
</Truncate>

<Truncate clamp="front">
  Carbon Components Svelte is a Svelte component library that implements the
  Carbon Design System, an open source design system by IBM.
</Truncate>

<h4 use:truncate>
  Carbon Components Svelte is a Svelte component library that implements the
  Carbon Design System, an open source design system by IBM.
</h4>
<h4 use:truncate="{{ clamp: 'front' }}">
  Carbon Components Svelte is a Svelte component library that implements the
  Carbon Design System, an open source design system by IBM.
</h4>
