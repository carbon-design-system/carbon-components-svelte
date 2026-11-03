import { fieldsetDisabled } from "../../src/utils/fieldset-disabled.js";

function byId(id: string) {
  const el = document.getElementById(id);
  assert(el, `expected #${id}`);
  return el;
}

describe("fieldsetDisabled", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("follows a disabled fieldset, except inside its first legend", async () => {
    document.body.innerHTML = `
      <fieldset id="outer">
        <legend><div id="in-legend"></div></legend>
        <div id="field"></div>
      </fieldset>`;
    const outer = byId("outer");
    assert(outer instanceof HTMLFieldSetElement);
    const field = vi.fn();
    const legend = vi.fn();
    const a = fieldsetDisabled(byId("field"), field);
    const b = fieldsetDisabled(byId("in-legend"), legend);

    outer.disabled = true;
    await Promise.resolve();
    outer.disabled = false;
    await Promise.resolve();

    expect(field.mock.calls).toEqual([[true], [false]]);
    expect(legend).not.toHaveBeenCalled();
    a.destroy();
    b.destroy();
  });

  it("reports a fieldset that is disabled at mount", () => {
    document.body.innerHTML = `<fieldset disabled><div id="field"></div></fieldset>`;
    const onChange = vi.fn();

    fieldsetDisabled(byId("field"), onChange).destroy();

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
