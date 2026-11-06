// @vitest-environment node
import {
  createOverlay,
  getModalHost,
  overlay,
  routeEscape,
} from "../../src/utils/overlay-stack.js";

describe("overlay stack on the server", () => {
  it("imports and does nothing without a document", () => {
    const layer = createOverlay({ modal: true, onDismiss: vi.fn() });

    layer.open();
    layer.sync(true);
    layer.update({ modal: false });
    layer.restoreFocus();
    layer.close();

    expect(layer.isOpen()).toBe(false);
    expect(getModalHost()).toBeNull();
    expect(routeEscape({ key: "Escape" } as KeyboardEvent)).toBe(false);
  });

  it("runs the action without a document", () => {
    const action = overlay({} as Element, {
      enabled: true,
      onDismiss: vi.fn(),
    });

    action.update({ enabled: false, onDismiss: vi.fn() });
    action.destroy();
  });
});
