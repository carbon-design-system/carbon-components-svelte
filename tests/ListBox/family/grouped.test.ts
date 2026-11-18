import { screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import { caseRows, field, type ListBoxCase, renderCase } from "./cases";

const regions = [
  { id: "us-west-2", text: "US West (Oregon)", group: "Americas" },
  { id: "eu-west-1", text: "Europe (Ireland)", group: "Europe" },
  { id: "us-east-1", text: "US East (N. Virginia)", group: "Americas" },
  { id: "global", text: "Global edge network" },
];

async function openOptions(c: ListBoxCase, fields: Record<string, unknown>) {
  const { unmount } = renderCase(c, fields);
  await user.click(field());
  const texts = screen
    .getAllByRole("option")
    .map((option) => option.textContent?.trim());
  const groups = within(screen.getByRole("listbox")).queryAllByRole("group");
  const headers = document.querySelectorAll(".bx--list-box__menu-group-header");
  unmount();
  return { texts, groups: groups.length, headers: headers.length };
}

describe.each(caseRows)("%s grouped={false}", (_, c) => {
  it("groups by default", async () => {
    const { groups, headers } = await openOptions(c, { items: regions });

    expect(groups).toBe(2);
    expect(headers).toBe(2);
  });

  it("renders the list as if no item had a group", async () => {
    const flat = await openOptions(c, {
      items: regions.map(({ group, ...item }) => item),
    });
    const ungrouped = await openOptions(c, {
      items: regions,
      grouped: false,
    });

    expect(ungrouped).toEqual(flat);
    expect(ungrouped.headers).toBe(0);
    expect(ungrouped.groups).toBe(0);
  });
});
