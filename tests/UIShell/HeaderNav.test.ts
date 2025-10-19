import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import HeaderNavTest from "./HeaderNavKeyboard.test.svelte";

describe("HeaderNav keyboard navigation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("HeaderNavMenu", () => {
		it("should open menu and focus first item when Down Arrow is pressed", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();
		});

		it("should open menu and focus last item when Up Arrow is pressed", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowUp}");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

			const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
			expect(lastItem).toHaveFocus();
		});

		it("should close menu when Escape is pressed and return focus to trigger", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{Enter}");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

			await user.keyboard("{Escape}");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
			expect(menuTrigger).toHaveFocus();
		});

		it("should toggle menu when Space is pressed on trigger", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard(" ");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

			menuTrigger.focus();
			await user.keyboard(" ");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
		});
	});

	describe("HeaderNavItem within menu", () => {
		it("should move to next item when Down Arrow is pressed", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");
			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();

			await user.keyboard("{ArrowDown}");
			const secondItem = screen.getByRole("menuitem", { name: "Menu Item 2" });
			expect(secondItem).toHaveFocus();
		});

		it("should move to previous item when Up Arrow is pressed", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");
			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });

			await user.keyboard("{ArrowDown}");
			const secondItem = screen.getByRole("menuitem", { name: "Menu Item 2" });
			expect(secondItem).toHaveFocus();

			await user.keyboard("{ArrowUp}");
			expect(firstItem).toHaveFocus();
		});

		it("should wrap to last item when Up Arrow is pressed on first item", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");

			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();

			await user.keyboard("{ArrowUp}");
			const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
			expect(lastItem).toHaveFocus();
		});

		it("should wrap to first item when Down Arrow is pressed on last item", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowUp}");
			const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
			expect(lastItem).toHaveFocus();

			await user.keyboard("{ArrowDown}");
			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();
		});

		it("should focus first item when Home is pressed", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");

			const secondItem = screen.getByRole("menuitem", { name: "Menu Item 2" });
			expect(secondItem).toHaveFocus();

			await user.keyboard("{Home}");
			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();
		});

		it("should focus last item when End is pressed", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");

			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();

			await user.keyboard("{End}");
			const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
			expect(lastItem).toHaveFocus();
		});

		it("should close menu when Escape is pressed from menu item", async () => {
			render(HeaderNavTest);

			const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
			menuTrigger.focus();

			await user.keyboard("{ArrowDown}");

			const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
			expect(firstItem).toHaveFocus();

			await user.keyboard("{Escape}");
			expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
			expect(menuTrigger).toHaveFocus();
		});
	});
});
