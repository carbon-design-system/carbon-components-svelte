import { render, screen } from "@testing-library/svelte";
import ComboBoxInModal from "../ComboBox/ComboBoxInModal.test.svelte";
import DropdownInModal from "../Dropdown/DropdownInModal.test.svelte";
import MultiSelectInModal from "../MultiSelect/MultiSelectInModal.test.svelte";
import { pressEscape } from "../utils/tooltip-escape";

function isModalOpen() {
  const modal = document.querySelector(".bx--modal");
  assert(modal);
  return modal.classList.contains("is-visible");
}

/** Presses Escape on the field; resolves `false` once its default is prevented. */
function pressEscapeOnField() {
  screen.getByRole("combobox").focus();
  return pressEscape();
}

describe("Escape in a list box inside a Modal", () => {
  describe.each([
    ["Dropdown", DropdownInModal, "dropdownOpen", {}],
    ["ComboBox", ComboBoxInModal, "comboBoxOpen", {}],
    ["MultiSelect", MultiSelectInModal, "multiSelectOpen", {}],
    [
      "MultiSelect (filterable)",
      MultiSelectInModal,
      "multiSelectOpen",
      { filterable: true },
    ],
  ] as const)("%s", (_name, Fixture, openProp, extraProps) => {
    it("closes the open menu without closing the modal", async () => {
      render(Fixture, {
        props: { modalOpen: true, [openProp]: true, ...extraProps },
      });

      const defaultAllowed = await pressEscapeOnField();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(isModalOpen()).toBe(true);
      // A native modal `<dialog>` closes as Escape's default action.
      expect(defaultAllowed).toBe(false);
    });

    it("lets Escape close the modal when the menu is closed", async () => {
      render(Fixture, {
        props: { modalOpen: true, [openProp]: false, ...extraProps },
      });

      await pressEscapeOnField();

      expect(isModalOpen()).toBe(false);
    });
  });

  it("keeps the modal open when Escape clears a closed ComboBox's selection", async () => {
    render(ComboBoxInModal, {
      props: { modalOpen: true, comboBoxOpen: false, selectedId: "1" },
    });
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("Email");

    const defaultAllowed = await pressEscapeOnField();

    expect(input).toHaveValue("");
    expect(isModalOpen()).toBe(true);
    expect(defaultAllowed).toBe(false);
  });
});
