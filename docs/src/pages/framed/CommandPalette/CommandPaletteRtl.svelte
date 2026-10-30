<script>
  import {
    Button,
    CommandPalette,
    LayoutDirection,
  } from "carbon-components-svelte";
  import Restart from "carbon-icons-svelte/lib/Restart.svelte";
  import Rocket from "carbon-icons-svelte/lib/Rocket.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = true;

  const items = [
    {
      id: "deploy",
      text: "نشر آخر إصدار",
      icon: Rocket,
      shortcut: "mod+shift+d",
    },
    { id: "restart", text: "إعادة تشغيل الخدمة", icon: Restart },
    {
      id: "env",
      text: "تعديل متغيرات البيئة",
      description: "المتغيرات والملفات السرية",
      icon: Settings,
    },
  ];
</script>

<LayoutDirection dir="rtl">
  <Button on:click={() => (open = true)}>فتح لوحة الأوامر</Button>
  <CommandPalette
    bind:open
    {items}
    placeholder="ابحث عن أمر"
    labelText="ابحث عن أمر"
    emptyText="لا توجد نتائج"
  />
</LayoutDirection>
