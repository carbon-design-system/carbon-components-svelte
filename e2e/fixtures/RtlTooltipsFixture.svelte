<script>
  import {
    AILabel,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    OperationalTag,
    OverflowMenu,
    OverflowMenuItem,
    PinCodeInput,
    Popover,
    Tag,
    TagInput,
    TagSet,
    Toggletip,
    Tooltip,
    TooltipDefinition,
    TooltipIcon,
    UserAvatar,
    UserAvatarGroup,
  } from "carbon-components-svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  // `?dir=rtl` sets the page direction before anything mounts, since the
  // components read it when they open.
  if (new URLSearchParams(location.search).get("dir") === "rtl") {
    document.documentElement.dir = "rtl";
  }
</script>

<div class="column">
  <div class="case" data-testid="tooltip-start">
    <Tooltip open align="start" triggerText="الخطة" tooltipId="tooltip-start">
      <p>تُحسب الرسوم كل شهر.</p>
    </Tooltip>
  </div>
  <div class="case" data-testid="tooltip-end">
    <Tooltip
      open
      align="end"
      direction="top"
      triggerText="الخطة"
      tooltipId="tooltip-end"
    >
      <p>تُحسب الرسوم كل شهر.</p>
    </Tooltip>
  </div>
  <div class="case" data-testid="tooltip-center">
    <Tooltip open triggerText="الخطة" tooltipId="tooltip-center">
      <p>تُحسب الرسوم كل شهر.</p>
    </Tooltip>
  </div>
  <div class="case" data-testid="tooltip-right">
    <Tooltip
      open
      align="start"
      direction="right"
      triggerText="الخطة"
      tooltipId="tooltip-right"
    >
      <p>تُحسب الرسوم كل شهر.</p>
    </Tooltip>
  </div>
  <div class="case" data-testid="tooltip-portal">
    <Tooltip
      open
      portalTooltip
      align="start"
      triggerText="الخطة"
      tooltipId="tooltip-portal"
    >
      <p>تُحسب الرسوم كل شهر.</p>
    </Tooltip>
  </div>
  <div class="case" data-testid="popover-top-start">
    <div class="anchor">
      <Popover open caret align="top-start" id="popover-top-start">
        <div class="content">تُحسب الرسوم كل شهر.</div>
      </Popover>
    </div>
  </div>
  <div class="case" data-testid="popover-bottom-end">
    <div class="anchor">
      <Popover open caret align="bottom-end" id="popover-bottom-end">
        <div class="content">تُحسب الرسوم كل شهر.</div>
      </Popover>
    </div>
  </div>
  <div class="case" data-testid="popover-top-left">
    <div class="anchor">
      <Popover open caret align="top-left" id="popover-top-left">
        <div class="content">تُحسب الرسوم كل شهر.</div>
      </Popover>
    </div>
  </div>
  <div class="case" data-testid="toggletip-start">
    <Toggletip open align="start" id="toggletip-start">
      تُحسب الرسوم كل شهر.
    </Toggletip>
  </div>
  <div class="case" data-testid="toggletip-end">
    <Toggletip open align="end" direction="top" id="toggletip-end">
      تُحسب الرسوم كل شهر.
    </Toggletip>
  </div>
  <div class="case" data-testid="toggletip-portal">
    <Toggletip open portalTooltip align="start" id="toggletip-portal">
      تُحسب الرسوم كل شهر.
    </Toggletip>
  </div>
  <div class="case" data-testid="ai-label">
    <AILabel open id="ai-label">أُنشئ من بيانات الخطة.</AILabel>
  </div>
  <div class="case" data-testid="tooltip-icon-start">
    <TooltipIcon
      align="start"
      tooltipText="تُحسب الرسوم كل شهر"
      id="tooltip-icon-start"
    />
  </div>
  <div class="case" data-testid="tooltip-icon-end">
    <TooltipIcon
      align="end"
      direction="top"
      tooltipText="تُحسب الرسوم كل شهر"
      id="tooltip-icon-end"
    />
  </div>
  <div class="case" data-testid="tooltip-icon-portal">
    <TooltipIcon
      portalTooltip
      align="start"
      tooltipText="تُحسب الرسوم كل شهر"
      id="tooltip-icon-portal"
    />
  </div>
  <div class="case" data-testid="tooltip-definition">
    <TooltipDefinition
      align="start"
      tooltipText="الخطة التي تدفع مقابلها"
      id="tooltip-definition"
    >
      الخطة
    </TooltipDefinition>
  </div>
  <div class="case" data-testid="tooltip-definition-portal">
    <TooltipDefinition
      portalTooltip
      align="end"
      tooltipText="الخطة التي تدفع مقابلها"
      id="tooltip-definition-portal"
    >
      الخطة
    </TooltipDefinition>
  </div>
  <div class="case" data-testid="button-tooltip">
    <Button
      kind="ghost"
      iconOnly
      icon={Edit}
      iconDescription="تعديل الخطة"
      tooltipAlignment="start"
    />
  </div>
  <div class="case" data-testid="breadcrumb">
    <Breadcrumb noTrailingSlash>
      <BreadcrumbItem href="#">المشاريع</BreadcrumbItem>
      <BreadcrumbItem>
        <OverflowMenu>
          <OverflowMenuItem href="#" text="الفوترة" />
          <OverflowMenuItem href="#" text="الاستخدام" />
        </OverflowMenu>
      </BreadcrumbItem>
      <BreadcrumbItem href="#" isCurrentPage>الخطة</BreadcrumbItem>
    </Breadcrumb>
  </div>
  <div data-testid="tag-input">
    <TagInput labelText="المناطق" value={["أوريغون", "أوهايو"]} />
  </div>
  <div data-testid="pin-code">
    <PinCodeInput labelText="الرمز" />
  </div>
  <div data-testid="plus-counts">
    <TagSet maxVisible={1}>
      <Tag>الفوترة</Tag>
      <Tag>الأمان</Tag>
    </TagSet>
    <TagSet overflowMode="popover" maxVisible={1}>
      <Tag>الفوترة</Tag>
      <Tag>الأمان</Tag>
      <Tag>التخزين</Tag>
    </TagSet>
    <UserAvatarGroup max={1}>
      <UserAvatar name="Monica Hall" />
      <UserAvatar name="Jared Dunn" />
    </UserAvatarGroup>
    <UserAvatarGroup max={1} total={120}>
      <UserAvatar name="Monica Hall" />
    </UserAvatarGroup>
  </div>
  <div class="case" data-testid="operational-tag-start">
    <OperationalTag open id="operational-tag-start">
      السياسات
      <div slot="content" class="content">تُحسب الرسوم كل شهر.</div>
    </OperationalTag>
  </div>
  <div class="case" data-testid="operational-tag-end">
    <OperationalTag open align="end" direction="top" id="operational-tag-end">
      السياسات
      <div slot="content" class="content">تُحسب الرسوم كل شهر.</div>
    </OperationalTag>
  </div>
</div>

<style>
  .column {
    max-width: 40rem;
    padding: 1rem;
  }

  /* Room for the floating content on every side of the trigger. */
  .case {
    display: flex;
    justify-content: center;
    padding: 6rem 0;
  }

  /* Shows where a popover's trigger would sit. */
  .anchor {
    position: relative;
    width: 2rem;
    height: 2rem;
    outline: 1px dashed currentColor;
  }

  .content {
    width: 12rem;
    padding: 1rem;
  }
</style>
