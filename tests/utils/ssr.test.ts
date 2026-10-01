// @vitest-environment node
import { FORM_CONTEXT_KEY } from "carbon-components-svelte/constants/context-keys.js";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import { normalizeSSR, renderSSR } from "./ssr";

describe("normalizeSSR", () => {
  it("strips Svelte's hydration comments", () => {
    expect(
      normalizeSSR(
        "<!--[--><div><!--[-1--><!--]-->a<!----></div><select><!></select><!--]-->",
      ),
    ).toBe("<div>a</div><select></select>");
  });

  it("replaces random ids in first-seen order and keeps pairs matching", () => {
    expect(
      normalizeSSR(
        '<label for="ccs-9jcsd4audbr"></label><input id="ccs-9jcsd4audbr" aria-describedby="cua-x1y2z3w4">',
      ),
    ).toBe(
      '<label for="id-1"></label><input id="id-1" aria-describedby="id-2">',
    );
  });

  it("replaces the random part of derived ids", () => {
    expect(
      normalizeSSR(
        '<input id="ccs-9jcsd4audbr" aria-describedby="helper-ccs-9jcsd4audbr"><ul id="ccs-9jcsd4audbr-menu">',
      ),
    ).toBe(
      '<input id="id-1" aria-describedby="helper-id-1"><ul id="id-1-menu">',
    );
  });

  it("leaves custom properties and classes that share a prefix", () => {
    const html =
      '<div class="bx--tree-node" style="--ccs-separator: 1rem"></div>';

    expect(normalizeSSR(html)).toBe(html);
  });

  it("drops whitespace between tags but not inside text", () => {
    expect(normalizeSSR("<p>\n  <b>a b</b> <i>c</i>\n</p>")).toBe(
      "<p><b>a b</b><i>c</i></p>",
    );
  });
});

describe("renderSSR", () => {
  it("passes props through and returns a queryable document", () => {
    const { html, document } = renderSSR(TextInput, {
      labelText: "Name",
      value: "Ada",
    });

    const input = document.querySelector("input");
    assert(input);
    expect(input.value).toBe("Ada");
    expect(
      document.querySelector(`label[for="${input.id}"]`),
    ).toHaveTextContent("Name");
    expect(html).not.toContain("<!--");
  });

  it("renders the same HTML twice despite random ids", () => {
    const props = { labelText: "Name", helperText: "Help" };

    expect(renderSSR(TextInput, props).html).toBe(
      renderSSR(TextInput, props).html,
    );
  });

  it("forwards context to the component", () => {
    const context = new Map([[FORM_CONTEXT_KEY, { isFluid: true }]]);
    const { document } = renderSSR(
      TextInput,
      { labelText: "Name" },
      { context },
    );

    expect(document.querySelector(".bx--text-input--fluid")).not.toBeNull();
  });
});
