<script lang="ts">
  import FileUploaderSkeleton from "carbon-components-svelte/FileUploader/FileUploaderSkeleton.svelte";
</script>

<FileUploaderSkeleton
  data-testid="file-uploader-skeleton"
  {...$$props}
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
