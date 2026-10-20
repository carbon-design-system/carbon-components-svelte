import { render } from "@testing-library/svelte";
import type { Component } from "svelte";
import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.test.svelte";
import TooltipIcon from "../TooltipIcon/TooltipIcon.test.svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";

describe.each<[string, Component<{ open: boolean }>]>([
  ["TooltipIcon", TooltipIcon],
  ["TooltipDefinition", TooltipDefinition],
])("%s window listeners", (_name, Fixture) => {
  it("closed tooltips register no window keydown listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(Fixture, { props: { open: false } });
    expect(netListenerCalls(add, remove, "keydown")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  it("an open tooltip registers exactly one window keydown listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(Fixture, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "keydown")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
