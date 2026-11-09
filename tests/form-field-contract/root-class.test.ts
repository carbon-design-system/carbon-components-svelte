import { render, screen } from "@testing-library/svelte";
import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
import type { ComponentType } from "svelte";
import { cases } from "./cases";
import { controls, type FieldCase, title } from "./contract";
import FieldHost from "./fixtures/FieldHost.test.svelte";

const rootProps = {
  class: "consumer-class",
  style: "margin: 7px",
  "data-testid": "consumer-attr",
};

const renderField = (
  component: ComponentType,
  props: Record<string, unknown> = {},
) => {
  const { container } = render(FieldHost, {
    props: { component, fieldProps: { ...props, ...rootProps } },
  });
  const first = container.firstElementChild;
  assert(first instanceof HTMLElement);
  return first;
};

const expectOnRoot = (root: HTMLElement, controls: HTMLElement[]) => {
  expect(root).toHaveClass("consumer-class");
  expect(root).toHaveStyle({ margin: "7px" });
  for (const control of controls) {
    if (control === root) continue;
    expect(control).not.toHaveClass("consumer-class");
    expect(control.style.margin).toBe("");
  }
};

const withFluid = cases.flatMap((c) => [
  [title(c), c, {}] as const,
  ...(c.fluid ? [[`${title(c)} fluid`, c, { fluid: true }] as const] : []),
]);

describe.each(withFluid)("%s", (_, c: FieldCase, extra) => {
  it("puts a consumer class and style on the root", () => {
    const first = renderField(c.component, { ...c.props, ...extra });
    expectOnRoot(c.root?.() ?? first, controls(c));
  });

  it("keeps other rest props off the root", () => {
    const first = renderField(c.component, { ...c.props, ...extra });
    const root = c.root?.() ?? first;
    const target = screen.queryByTestId("consumer-attr");
    // Fields that spread everything on the root keep doing so.
    if (target !== root) {
      expect(controls(c)).toContain(target);
    }
  });
});

describe("fields outside the cases", () => {
  it("SearchMenu puts a consumer class and style on the root", () => {
    const root = renderField(SearchMenu);
    const input = screen.getByRole("combobox");

    expect(root).toHaveClass("bx--search-menu");
    expectOnRoot(root, [input]);
    expect(input).toHaveAttribute("data-testid", "consumer-attr");
  });

  it("FileUploaderButton puts a consumer class and style on the button", () => {
    const button = renderField(FileUploaderButton);
    const input = document.querySelector("input[type='file']");
    assert(input instanceof HTMLElement);

    expect(button.tagName).toBe("BUTTON");
    expectOnRoot(button, [input]);
    expect(input).toHaveAttribute("data-testid", "consumer-attr");
  });
});
