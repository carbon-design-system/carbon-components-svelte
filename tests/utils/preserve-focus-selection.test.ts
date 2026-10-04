import { preserveFocusSelection } from "../../src/utils/preserve-focus-selection.js";

describe("preserveFocusSelection action", () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = `<input id="i" value="secret-token">`;
    const found = document.querySelector<HTMLInputElement>("#i");
    assert(found);
    input = found;
    // Stand-in for a component's own select-on-focus handler.
    input.addEventListener("focus", () => input.select());
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  /** Mimic a click: mousedown, focus, mouseup. Returns the mouseup event. */
  function click(beforeMouseup?: () => void) {
    input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    input.focus();
    beforeMouseup?.();
    const mouseup = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(mouseup);
    return mouseup;
  }

  it("cancels the mouseup after a click so WebKit keeps the selection", () => {
    const action = preserveFocusSelection(input, true);

    expect(click().defaultPrevented).toBe(true);

    action.destroy();
  });

  it("leaves a later mouseup alone once the field is focused", () => {
    const action = preserveFocusSelection(input, true);
    click();

    expect(click().defaultPrevented).toBe(false);

    action.destroy();
  });

  it("leaves the mouseup alone when a drag changed the selection", () => {
    const action = preserveFocusSelection(input, true);

    expect(click(() => input.setSelectionRange(2, 5)).defaultPrevented).toBe(
      false,
    );

    action.destroy();
  });

  it("leaves the mouseup alone when nothing selected the value", () => {
    const action = preserveFocusSelection(input, true);

    expect(click(() => input.setSelectionRange(3, 3)).defaultPrevented).toBe(
      false,
    );

    action.destroy();
  });

  it("always cancels for input types without a selection API", () => {
    input.type = "number";
    input.value = "123";
    const action = preserveFocusSelection(input, true);

    expect(input.selectionStart).toBeNull();
    expect(click().defaultPrevented).toBe(true);

    action.destroy();
  });

  it("does nothing while disabled, and resumes on update", () => {
    const action = preserveFocusSelection(input, false);

    expect(click().defaultPrevented).toBe(false);

    action.update(true);
    input.blur();
    expect(click().defaultPrevented).toBe(true);

    action.destroy();
  });

  it("removes its listeners on destroy", () => {
    const action = preserveFocusSelection(input, true);
    action.destroy();

    expect(click().defaultPrevented).toBe(false);
  });
});
