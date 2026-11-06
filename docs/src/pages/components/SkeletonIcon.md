---
description: Skeleton icons provide a loading-state placeholder sized to match icons.
---

<script>
  import { SkeletonIcon, Stack } from "carbon-components-svelte";
</script>

## Sizes

SkeletonIcon wraps [SkeletonPlaceholder](/components/SkeletonPlaceholder) for icon-sized areas. Carbon icons use a 16/20/24/32 pixel scale, but you can set any pixel value with `size`.

### 16px (default)

<SkeletonIcon />

### 20px

<SkeletonIcon size={20} />

### 24px

<SkeletonIcon size={24} />

### 32px

<SkeletonIcon size={32} />

## Custom width and height

SkeletonIcon also accepts `width` and `height`, forwarded to the underlying [SkeletonPlaceholder](/components/SkeletonPlaceholder), for a non-square placeholder instead of `size`.

<SkeletonIcon width="2rem" height="1rem" />

## AI

Set `ai` to `true` for an icon that AI is generating. The skeleton turns blue, and a gradient sweeps across it. The sweep stops when the user prefers reduced motion.

<Stack orientation="horizontal" gap={5}>
  <SkeletonIcon ai />
  <SkeletonIcon ai size={20} />
  <SkeletonIcon ai size={24} />
  <SkeletonIcon ai size={32} />
</Stack>
