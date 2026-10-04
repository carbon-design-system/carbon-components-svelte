import { render, screen } from "@testing-library/svelte";
import ComboBoxInModal from "../ComboBox/ComboBoxInModal.test.svelte";
import DropdownInModal from "../Dropdown/DropdownInModal.test.svelte";
import MultiSelectInModal from "../MultiSelect/MultiSelectInModal.test.svelte";
import { user } from "../utils/user";

function isModalOpen() {
  const modal = document.querySelector(".bx--modal");
  assert(modal);
  return modal.classList.contains("is-visible");
}

async function pressEscapeOnField() {
  const field = screen.getByRole("combobox");
  field.focus();
  await user.keyboard("{Escape}");
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

      await pressEscapeOnField();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(isModalOpen()).toBe(true);
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

    await pressEscapeOnField();

    expect(input).toHaveValue("");
    expect(isModalOpen()).toBe(true);
  });
});
