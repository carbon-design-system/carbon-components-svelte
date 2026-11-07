<script>
  import {
    Button,
    createFocusNav,
    focusNav,
    LayoutDirection,
    Stack,
  } from "carbon-components-svelte";

  const actions = ["إعادة التشغيل", "تغيير الحجم", "إيقاف مؤقت", "حذف"];

  let toolbar;

  // `rtl` is read on each key, so a `dir` change mid-session is picked up.
  const nav = createFocusNav({
    selector: "button",
    rtl: () => getComputedStyle(toolbar).direction === "rtl",
  });
</script>

<LayoutDirection dir="rtl" lang="ar">
  <Stack as orientation="horizontal" gap={3} let:props>
    <div
      {...props}
      bind:this={toolbar}
      role="toolbar"
      aria-label="إجراءات النشر"
      use:focusNav={nav}
    >
      {#each actions as action, i (action)}
        <Button
          kind="tertiary"
          size="small"
          tabindex={i === $nav.tabStop ? 0 : -1}
        >
          {action}
        </Button>
      {/each}
    </div>
  </Stack>
</LayoutDirection>
