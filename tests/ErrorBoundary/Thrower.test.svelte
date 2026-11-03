<script lang="ts">
  export let control: { fail: unknown } = { fail: false };

  if (control.fail) throw control.fail;
</script>

<p data-testid="child">Child content</p>
