import { render, screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBoxSkeleton from "carbon-components-svelte/ComboBox/ComboBoxSkeleton.svelte";
import FluidComboBoxSkeleton from "carbon-components-svelte/ComboBox/FluidComboBoxSkeleton.svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import DropdownSkeleton from "carbon-components-svelte/Dropdown/DropdownSkeleton.svelte";
import FluidDropdownSkeleton from "carbon-components-svelte/Dropdown/FluidDropdownSkeleton.svelte";
import FluidMultiSelectSkeleton from "carbon-components-svelte/MultiSelect/FluidMultiSelectSkeleton.svelte";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import MultiSelectSkeleton from "carbon-components-svelte/MultiSelect/MultiSelectSkeleton.svelte";
import type { ComponentProps, ComponentType } from "svelte";
import ComboBoxForm from "../../ComboBox/ComboBox.form.test.svelte";
import DropdownForm from "../../Dropdown/Dropdown.form.test.svelte";
import MultiSelectForm from "../../MultiSelect/MultiSelect.form.test.svelte";
import ListBoxHost from "./ListBoxHost.test.svelte";

/**
 * One case per list box component, for the behaviors Dropdown, ComboBox and
 * MultiSelect share. A filterable MultiSelect is its own case: its field is
 * the filter input rather than a button.
 */
export type ListBoxCase = {
  name: string;
  component: ComponentType;
  /** Props every render of this case starts from. */
  props: Record<string, unknown>;
  /** Keys that open a closed menu, with trigger `keydown`. */
  openKeys: string[];
  /** Typing in the field opens the menu, with trigger `input`. */
  opensOnInput: boolean;
  /** Picking an option closes the menu, with trigger `select`. */
  selectCloses: boolean;
  /** Window events an open menu listens for. */
  windowEvents: string[];
  /** Fixture that renders this case inside `<form data-testid="form">`. */
  form: ComponentType;
  /** Props the form fixture needs to render this case. */
  formProps?: Record<string, unknown>;
  skeleton?: {
    component: ComponentType;
    fluid: ComponentType;
    /** Class that tells this skeleton from the other list box skeletons. */
    className: string;
  };
};

export const cases: ListBoxCase[] = [
  {
    name: "Dropdown",
    component: Dropdown,
    props: { labelText: "Contact" },
    openKeys: ["{ArrowDown}", "{Enter}"],
    opensOnInput: false,
    selectCloses: true,
    windowEvents: ["click"],
    form: DropdownForm,
    skeleton: {
      component: DropdownSkeleton,
      fluid: FluidDropdownSkeleton,
      className: "bx--dropdown-v2",
    },
  },
  {
    name: "ComboBox",
    component: ComboBox,
    props: { labelText: "Contact", placeholder: "Select…" },
    openKeys: ["{ArrowDown}", "{Enter}"],
    opensOnInput: true,
    selectCloses: true,
    windowEvents: ["click"],
    form: ComboBoxForm,
    skeleton: {
      component: ComboBoxSkeleton,
      fluid: FluidComboBoxSkeleton,
      className: "bx--combo-box",
    },
  },
  {
    name: "MultiSelect",
    component: MultiSelect,
    props: { labelText: "Contact", label: "Select contact methods" },
    openKeys: ["{ArrowDown}", "{Enter}"],
    opensOnInput: false,
    selectCloses: false,
    windowEvents: ["click", "focusin"],
    form: MultiSelectForm,
    skeleton: {
      component: MultiSelectSkeleton,
      fluid: FluidMultiSelectSkeleton,
      className: "bx--multi-select",
    },
  },
  {
    name: "MultiSelect (filterable)",
    component: MultiSelect,
    props: {
      labelText: "Contact",
      filterable: true,
      placeholder: "Filter contacts",
    },
    // Enter in the filter input does not open the menu.
    openKeys: ["{ArrowDown}"],
    opensOnInput: true,
    selectCloses: false,
    windowEvents: ["click", "focusin"],
    form: MultiSelectForm,
    formProps: { filterable: true },
  },
];

export const contacts = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
];

type HostProps = Omit<ComponentProps<ListBoxHost>, "component" | "fieldProps">;

/**
 * Renders `c` in the shared host. `fieldProps` lands on the component after
 * the case's own props; everything else is a host prop (`open`, handlers).
 */
export function renderCase(
  c: ListBoxCase,
  fieldProps: Record<string, unknown> = {},
  hostProps: HostProps = {},
) {
  const props = (fields: Record<string, unknown>) => ({
    component: c.component,
    fieldProps: { items: contacts, ...c.props, ...fields },
    ...hostProps,
  });
  const result = render(ListBoxHost, { props: props(fieldProps) });
  return {
    ...result,
    /** Re-renders with new field props, keeping the case's own. */
    rerenderField: (fields: Record<string, unknown>) =>
      result.rerender(props(fields)),
  };
}

/** The element with `role="combobox"`: a button, or the filter input. */
export function field() {
  return screen.getByRole("combobox");
}

/** `[name, case]` rows for `describe.each`. */
export const caseRows = cases.map((c) => [c.name, c] as const);
