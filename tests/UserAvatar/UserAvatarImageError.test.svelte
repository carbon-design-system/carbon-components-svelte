<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";

  export let image = "https://example.com/broken.jpg";
  export let name = "Jane Doe";
  export let onImageError = () => {};
</script>

<UserAvatar
  data-testid="image-error"
  {image}
  {name}
  imageDescription="User photo"
  on:image:error={onImageError}
/>
