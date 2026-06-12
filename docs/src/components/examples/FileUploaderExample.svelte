<script lang="ts">
  import {
    Box,
    FileUploaderDropContainer,
    FileUploaderItem,
    Stack,
    Text,
  } from "carbon-components-svelte";
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <Text tag="h3" type="productive-heading-03" color="primary">
      Upload release artifacts
    </Text>
    <Stack gap={4}>
      <FileUploaderDropContainer
        multiple
        labelText="Drag and drop files here or click to upload"
      />
      <Stack gap={2}>
        <FileUploaderItem name="release-2.4.0.tar.gz" status="complete" />
        <FileUploaderItem name="checksums.txt" status="complete" />
        <FileUploaderItem name="manifest.json" status="uploading" />
      </Stack>
    </Stack>
  </Stack>
</Box>
