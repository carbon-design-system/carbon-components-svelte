export interface ComponentCategory {
  label: string;
  components: string[];
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    label: "Navigation",
    components: ["UIShell", "Breadcrumb", "Link"],
  },
  {
    label: "Data & lists",
    components: [
      "DataTable",
      "TreeView",
      "StructuredList",
      "ContainedList",
      "OrderedList",
      "RecursiveList",
      "UnorderedList",
    ],
  },
  {
    label: "Layout",
    components: [
      "Grid",
      "Stack",
      "Box",
      "AspectRatio",
      "Accordion",
      "Disclosure",
    ],
  },
  {
    label: "Actions",
    components: [
      "Button",
      "ButtonSet",
      "Toolbar",
      "CopyButton",
      "OverflowMenu",
      "ContextMenu",
      "MenuButton",
      "ComboButton",
    ],
  },
  {
    label: "View controls",
    components: ["Tabs", "ContentSwitcher", "Pagination", "PaginationNav"],
  },
  {
    label: "Dropdowns",
    components: ["Dropdown", "ComboBox", "MultiSelect", "Select"],
  },
  {
    label: "Search",
    components: ["Search", "SearchMenu"],
  },
  {
    label: "Content",
    components: ["Heading", "Text", "Tag", "TagSet", "CodeSnippet"],
  },
  {
    label: "Forms",
    components: [
      "CopyInput",
      "DatePicker",
      "FileUploader",
      "NumberInput",
      "PasswordInput",
      "PinCodeInput",
      "Slider",
      "TextArea",
      "TextInput",
      "TimePicker",
      "Checkbox",
      "RadioButton",
      "Toggle",
      "Form",
      "FluidForm",
    ],
  },
  {
    label: "Overlays",
    components: [
      "Dialog",
      "Modal",
      "ComposedModal",
      "Popover",
      "Toggletip",
      "Tooltip",
      "TooltipDefinition",
      "TooltipIcon",
    ],
  },
  {
    label: "Notifications",
    components: [
      "InlineNotification",
      "ToastNotification",
      "NotificationQueue",
      "BadgeIndicator",
    ],
  },
  {
    label: "Status",
    components: ["IconIndicator", "ShapeIndicator"],
  },
  {
    label: "Loading",
    components: [
      "Loading",
      "InlineLoading",
      "ProgressBar",
      "ProgressIndicator",
      "SkeletonText",
      "SkeletonIcon",
      "SkeletonPlaceholder",
    ],
  },
  {
    label: "Tiles",
    components: [
      "Tile",
      "ClickableTile",
      "ExpandableTile",
      "SelectableTile",
      "RadioTile",
    ],
  },
  {
    label: "Utilities",
    components: [
      "Theme",
      "Breakpoint",
      "Portal",
      "FloatingPortal",
      "LocalStorage",
      "SessionStorage",
      "ImageLoader",
      "Truncate",
    ],
  },
  {
    label: "Misc",
    components: ["UserAvatar", "UserAvatarGroup", "Menu"],
  },
];

export const CATEGORY_BY_COMPONENT: Record<string, string> =
  COMPONENT_CATEGORIES.reduce<Record<string, string>>((acc, category) => {
    for (const name of category.components) acc[name] = category.label;
    return acc;
  }, {});

export function assertCategoriesCover(componentNames: string[]): void {
  const known = new Set(componentNames);
  const categorized = new Set<string>();
  const duplicates: string[] = [];

  for (const category of COMPONENT_CATEGORIES) {
    for (const name of category.components) {
      if (categorized.has(name)) duplicates.push(name);
      categorized.add(name);
    }
  }

  const uncategorized = componentNames.filter((name) => !categorized.has(name));
  const unknown = [...categorized].filter((name) => !known.has(name));

  if (uncategorized.length || unknown.length || duplicates.length) {
    const lines = ["[component-categories] sidebar grouping is out of sync:"];
    if (uncategorized.length)
      lines.push(`  • uncategorized pages: ${uncategorized.join(", ")}`);
    if (unknown.length)
      lines.push(`  • categorized but no page exists: ${unknown.join(", ")}`);
    if (duplicates.length)
      lines.push(`  • in multiple categories: ${duplicates.join(", ")}`);
    console.warn(lines.join("\n"));
  }
}
