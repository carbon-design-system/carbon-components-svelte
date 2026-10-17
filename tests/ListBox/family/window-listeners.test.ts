import { flushDismiss } from "../../utils/flush-dismiss";
import { netListenerCalls } from "../../utils/net-listener-calls";
import { user } from "../../utils/user";
import { caseRows, renderCase } from "./cases";

describe.each(caseRows)("%s window listeners", (_, c) => {
  const spyOnWindow = () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    return (type: string) => netListenerCalls(add, remove, type);
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(c.windowEvents)(
    "closed menus register no window %s listener",
    async (type) => {
      const net = spyOnWindow();

      for (let i = 0; i < 5; i++) renderCase(c, {}, { open: false });
      await flushDismiss();

      expect(net(type)).toBe(0);
    },
  );

  it.each(c.windowEvents)(
    "an open menu registers exactly one window %s listener, removed on close",
    async (type) => {
      const net = spyOnWindow();

      renderCase(c, {}, { open: true });
      await flushDismiss();
      expect(net(type)).toBe(1);

      // An outside click closes the menu, which must tear down the listener.
      await user.click(document.body);
      expect(net(type)).toBe(0);
    },
  );
});
