import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import ModalLayers from "./ModalLayers.test.svelte";

describe("Modal layers", () => {
  it("closes a popover on Escape before the modal", async () => {
    const onclose = vi.fn();
    render(ModalLayers, { props: { onclose } });
    await user.click(screen.getByText("Toggle popover"));
    await flushDismiss();
    expect(document.querySelector(".bx--popover--open")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      document.querySelector(".bx--popover--open"),
    ).not.toBeInTheDocument();
    expect(onclose).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onclose).toHaveBeenCalledWith({ trigger: "escape-key" });
  });

  it("closes a menu on Escape before the modal, and focuses its trigger", async () => {
    const onclose = vi.fn();
    render(ModalLayers, { props: { onclose } });
    await user.click(screen.getByTestId("menu-trigger"));
    await flushDismiss();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onclose).not.toHaveBeenCalled();
    expect(screen.getByTestId("menu-trigger")).toHaveFocus();
  });

  it("closes only the layers above the one clicked", async () => {
    const onclose = vi.fn();
    render(ModalLayers, { props: { onclose } });
    await user.click(screen.getByText("Toggle popover"));
    await flushDismiss();
    expect(document.querySelector(".bx--popover--open")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Name"));
    expect(
      document.querySelector(".bx--popover--open"),
    ).not.toBeInTheDocument();
    expect(onclose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the modal open when a backdrop press closes a layer above it", async () => {
    const onclose = vi.fn();
    render(ModalLayers, { props: { onclose } });
    await user.click(screen.getByTestId("menu-trigger"));
    await flushDismiss();

    const backdrop = document.querySelector(".bx--modal") as Element;
    await user.click(backdrop);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onclose).not.toHaveBeenCalled();

    await user.click(backdrop);
    await tick();
    expect(onclose).toHaveBeenCalledWith({ trigger: "outside-click" });
  });

  it("closes an open Dropdown list on a backdrop press, then the modal", async () => {
    const onclose = vi.fn();
    render(ModalLayers, { props: { onclose } });
    await user.click(screen.getByRole("combobox", { name: "Channel" }));
    await flushDismiss();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    const backdrop = document.querySelector(".bx--modal") as Element;
    await user.click(backdrop);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onclose).not.toHaveBeenCalled();

    await user.click(backdrop);
    await tick();
    expect(onclose).toHaveBeenCalledWith({ trigger: "outside-click" });
  });

  it("makes the page behind inert while open and restores it on close", async () => {
    render(ModalLayers);
    await tick();
    const pageButton = screen.getByText("Page button");
    expect(pageButton).toHaveAttribute("inert");

    await user.keyboard("{Escape}");
    await tick();
    expect(pageButton).not.toHaveAttribute("inert");
  });
});
