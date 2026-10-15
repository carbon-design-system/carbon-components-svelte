import { expect, test } from "@playwright/test";
import { getAXTree } from "./helpers/ax-tree";

// axe checks that ARIA ids resolve, not that the text reaches the element
// that takes focus or carries the role. These tests read the name and
// description from Chromium's accessibility tree, which is what NVDA and
// JAWS announce in Chrome and Edge. Most fixtures pass a consumer
// aria-describedby="note", which should join after the built-in description.
type Case = {
  role: string;
  name: string;
  description?: string;
  errorMessage?: string;
};

const NOTE = "Extra note";

const cases: Case[] = [
  // Text fields
  {
    role: "textbox",
    name: "Email",
    description: `We never share your email ${NOTE}`,
  },
  {
    role: "textbox",
    name: "Username",
    description: NOTE,
    errorMessage: "Username is taken",
  },
  {
    role: "textbox",
    name: "Nickname",
    description: `Nickname is public ${NOTE}`,
  },
  {
    role: "textbox",
    name: "Password",
    description: `At least 12 characters ${NOTE}`,
  },
  {
    role: "textbox",
    name: "Bio",
    description: `Shown on your profile ${NOTE}`,
  },
  { role: "spinbutton", name: "Seats", description: `Up to 10 seats ${NOTE}` },
  { role: "searchbox", name: "Find a service", description: NOTE },
  { role: "textbox", name: "API key", description: `Keep it secret ${NOTE}` },
  {
    role: "textbox",
    name: "Tags",
    description:
      "Press Enter to add a tag. Press Backspace in an empty field to move to the tags, then Delete to remove one. Up to 5 tags",
  },
  {
    role: "group",
    name: "One-time code",
    description: `Sent by text message ${NOTE}`,
  },

  // Selects and lists
  {
    role: "combobox",
    name: "Region",
    description: `Pick the closest region ${NOTE}`,
  },
  {
    role: "combobox",
    name: "Channel",
    description: `Where we send alerts ${NOTE}`,
  },
  {
    role: "combobox",
    name: "Contact method",
    description: `How we reach you ${NOTE}`,
  },
  {
    role: "combobox",
    name: "Notify by",
    description: `Pick one or more ${NOTE}`,
  },
  { role: "textbox", name: "Start date", description: `mm/dd/yyyy ${NOTE}` },
  {
    role: "textbox",
    name: "Meeting time",
    description: `24-hour clock ${NOTE}`,
  },

  // Choices
  {
    role: "checkbox",
    name: "Subscribe",
    description: `One email a month ${NOTE}`,
  },
  {
    role: "switch",
    name: "Auto-renew",
    description: `You will be charged yearly ${NOTE}`,
  },
  { role: "radio", name: "Standard shipping", description: NOTE },
  {
    role: "slider",
    name: "Volume",
    description: `Applies to all devices ${NOTE}`,
  },
  { role: "slider", name: "Price range Lower bound" },
  { role: "slider", name: "Price range Upper bound" },

  // Tiles
  { role: "radio", name: "Monthly", description: "Billed every month" },
  { role: "checkbox", name: "Starter plan", description: NOTE },
  { role: "button", name: "Plan details", description: NOTE },

  // File uploaders
  {
    role: "button",
    name: "Add resume",
    description: `PDF only, up to 5 MB ${NOTE}`,
  },
  { role: "button", name: "Cover letter", description: "DOCX only" },
  {
    role: "button",
    name: "Drop files here",
    description: "Max file size is 1 MB",
  },

  // Disclosure
  { role: "button", name: "Shipping policy", description: NOTE },
  { role: "button", name: "More details", description: NOTE },
  { role: "tab", name: "Calendar", description: NOTE },

  // Tooltips
  { role: "button", name: "Resources", description: `Tip content ${NOTE}` },
  { role: "button", name: "Show billing help", description: NOTE },
  { role: "button", name: "IBM", description: `Armonk, New York ${NOTE}` },
  {
    role: "button",
    name: "Invoice help",
    description: `Shown on invoices ${NOTE}`,
  },
  { role: "button", name: "Ada's profile", description: NOTE },

  // Navigation and actions
  { role: "link", name: "Reports", description: NOTE },
  { role: "button", name: "Account step", description: NOTE },
  { role: "menuitem", name: "Rename", description: NOTE },
  { role: "button", name: "Save", description: NOTE },
  { role: "button", name: "Remove red filter", description: NOTE },

  // Data and status
  { role: "table", name: "Services", description: `All services ${NOTE}` },
  {
    role: "progressbar",
    name: "Upload",
    description: `40 of 100 MB ${NOTE}`,
  },
  { role: "meter", name: "Storage", description: `Resets monthly ${NOTE}` },
  { role: "textbox", name: "Install command", description: NOTE },
  { role: "tree", name: "Project files" },
  { role: "region", name: "Featured products" },
];

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Reads Chromium's accessibility tree over CDP",
);

// One page load and one tree snapshot for every case. Soft assertions report
// every failing case, not only the first.
test("controls expose their names and descriptions", async ({ page }) => {
  await page.goto("/accessible-names.html");
  await expect(page.getByText(NOTE)).toBeVisible();

  const tree = await getAXTree(page);
  try {
    // Skip the visually hidden file inputs behind the file uploader buttons.
    // Chromium exposes them as buttons with the same name.
    const results = await Promise.all(
      cases.map(async ({ role, name }) =>
        (await tree.query(role, name)).filter(
          (control) =>
            !(control.tagName === "INPUT" && control.type === "file"),
        ),
      ),
    );

    for (const [
      i,
      { role, name, description, errorMessage },
    ] of cases.entries()) {
      const label = `${role} "${name}"`;
      const controls = results[i];

      expect.soft(controls, label).toHaveLength(1);
      const [control] = controls;
      if (!control) continue;
      if (description !== undefined) {
        expect.soft(control.description, label).toBe(description);
      }
      if (errorMessage !== undefined) {
        expect.soft(control.invalid, label).toBe(true);
        expect.soft(control.errorMessage, label).toBe(errorMessage);
      }
    }
  } finally {
    await tree.dispose();
  }
});

for (const { variant, name, description } of [
  {
    variant: "modal",
    name: "Delete project",
    description: `This cannot be undone. ${NOTE}`,
  },
  {
    variant: "composed",
    name: "Remove member",
    description: `They lose access today. ${NOTE}`,
  },
]) {
  test(`${variant} dialog exposes its name and description`, async ({
    page,
  }) => {
    await page.goto(`/accessible-names-dialog.html?variant=${variant}`);
    await expect(page.getByRole("alertdialog")).toBeVisible();

    const tree = await getAXTree(page);
    try {
      const dialogs = await tree.query("alertdialog", name);
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].description).toBe(description);
    } finally {
      await tree.dispose();
    }
  });
}
