<script lang="ts">
  import {
    FileUploaderButton,
    FileUploader,
    FileUploaderDropContainer,
    FileUploaderItem,
    FileUploaderSkeleton,
  } from "../types";
</script>

<FileUploaderButton labelText="Add files" />

<FileUploader
  multiple
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription="Only JPEG files are accepted."
  accept="{['.jpg', '.jpeg']}"
  status="complete"
/>

<FileUploaderItem name="README.md" status="uploading" />

<FileUploaderItem name="README.md" status="complete" />

<FileUploaderItem invalid name="README.md" status="edit" />

<FileUploaderDropContainer
  labelText="Drag and drop files here or click to upload"
  multiple
/>

<FileUploaderSkeleton />
