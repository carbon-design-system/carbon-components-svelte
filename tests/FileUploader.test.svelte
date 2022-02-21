<script lang="ts">
  import {
    FileUploaderButton,
    FileUploader,
    FileUploaderDropContainer,
    FileUploaderItem,
    FileUploaderSkeleton,
  } from "../types";
</script>

<FileUploaderButton
  labelText="Add files"
  on:change="{(e) => {
    console.log(e.detail); // File[]
  }}"
/>

<FileUploader
  multiple
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription="Only JPEG files are accepted."
  accept="{['.jpg', '.jpeg']}"
  status="complete"
  on:add="{(e) => {
    console.log(e.detail); // File[]
  }}"
  on:remove="{(e) => {
    console.log(e.detail); // File[]
  }}"
  on:change="{(e) => {
    console.log(e.detail); // File[]
  }}"
/>

<FileUploaderItem name="README.md" status="uploading" />

<FileUploaderItem name="README.md" status="complete" />

<FileUploaderItem invalid name="README.md" status="edit" />

<FileUploaderDropContainer
  labelText="Drag and drop files here or click to upload"
  multiple
/>

<FileUploaderSkeleton />
