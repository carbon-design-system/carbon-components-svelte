import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import Component from "./ComposedModal.Story.svelte";

export default { title: "ComposedModal", decorators: [withKnobs] };

const sizes = {
  Default: "",
  "Extra small (xs)": "xs",
  "Small (sm)": "sm",
  "Large (lg)": "lg",
};

export const Default = () => ({
  Component,
  props: {
    composedModal: {
      open: boolean("Open (open in <ComposedModal>)", true),
      danger: boolean("Danger mode (danger)", false),
      selectorPrimaryFocus: text(
        "Primary focus element selector (selectorPrimaryFocus)",
        "[data-modal-primary-focus]"
      ),
      size: select("Size (size)", sizes, "sm"),
      preventCloseOnClickOutside: boolean(
        "Prevent the modal from closing when clicking outside (preventCloseOnClickOutside)",
        false
      ),
    },
    modalHeader: {
      label: text("Optional Label (label in <ModalHeader>)", "Optional Label"),
      title: text("Optional title (title in <ModalHeader>)", "Example"),
      iconDescription: text(
        "Close icon description (iconDescription in <ModalHeader>)",
        "Close"
      ),
    },
    modalBody: {
      hasScrollingContent: boolean(
        "Modal contains scrollable content (hasScrollingContent)",
        true
      ),
      "aria-label": text("ARIA label for content", "Example modal content"),
    },
    modalFooter: {
      primaryButtonText: text(
        "Primary button text (primaryButtonText in <ModalFooter>)",
        "Save"
      ),
      primaryButtonDisabled: boolean(
        "Primary button disabled (primaryButtonDisabled in <ModalFooter>)",
        false
      ),
      secondaryButtonText: text(
        "Secondary button text (secondaryButtonText in <ModalFooter>)",
        ""
      ),
    },
  },
});

export const ChildNodes = () => ({
  Component,
  props: {
    story: "child nodes",
    composedModal: {
      open: boolean("Open (open in <ComposedModal>)", true),
      danger: boolean("Danger mode (danger)", false),
      selectorPrimaryFocus: text(
        "Primary focus element selector (selectorPrimaryFocus)",
        "[data-modal-primary-focus]"
      ),
      size: select("Size (size)", sizes, "sm"),
    },
    modalHeader: {
      label: text("Optional Label (label in <ModalHeader>)", "Optional Label"),
      title: text("Optional title (title in <ModalHeader>)", "Example"),
      iconDescription: text(
        "Close icon description (iconDescription in <ModalHeader>)",
        "Close"
      ),
    },
    modalBody: {
      hasScrollingContent: boolean(
        "Modal contains scrollable content (hasScrollingContent)",
        true
      ),
      "aria-label": text("ARIA label for content", "Example modal content"),
    },
    modalFooter: {},
  },
});

export const TitleOnly = () => ({
  Component,
  props: {
    story: "title",
    composedModal: {
      open: boolean("Open (open in <ComposedModal>)", true),
      danger: boolean("Danger mode (danger)", false),
      selectorPrimaryFocus: text(
        "Primary focus element selector (selectorPrimaryFocus)",
        "[data-modal-primary-focus]"
      ),
      size: select("Size (size)", sizes, "sm"),
    },
    modalHeader: {
      label: text("Optional Label (label in <ModalHeader>)", "Optional Label"),
      title: text("Optional title (title in <ModalHeader>)", "Example"),
      iconDescription: text(
        "Close icon description (iconDescription in <ModalHeader>)",
        "Close"
      ),
    },
    modalBody: {
      hasScrollingContent: boolean(
        "Modal contains scrollable content (hasScrollingContent)",
        true
      ),
      "aria-label": text("ARIA label for content", "Example modal content"),
    },
    modalFooter: {
      primaryButtonText: text(
        "Primary button text (primaryButtonText in <ModalFooter>)",
        "Save"
      ),
      primaryButtonDisabled: boolean(
        "Primary button disabled (primaryButtonDisabled in <ModalFooter>)",
        false
      ),
      secondaryButtonText: text(
        "Secondary button text (secondaryButtonText in <ModalFooter>)",
        ""
      ),
    },
  },
});

export const Trigger = () => ({
  Component,
  props: {
    story: "trigger",
    composedModal: {
      open: boolean("Open (open in <ComposedModal>)", true),
      danger: boolean("Danger mode (danger)", false),
      selectorPrimaryFocus: text(
        "Primary focus element selector (selectorPrimaryFocus)",
        "[data-modal-primary-focus]"
      ),
      size: select("Size (size)", sizes, "sm"),
    },
    modalHeader: {
      label: text("Optional Label (label in <ModalHeader>)", "Optional Label"),
      title: text("Optional title (title in <ModalHeader>)", "Example"),
      iconDescription: text(
        "Close icon description (iconDescription in <ModalHeader>)",
        "Close"
      ),
    },
    modalBody: {
      hasScrollingContent: boolean(
        "Modal contains scrollable content (hasScrollingContent)",
        true
      ),
      "aria-label": text("ARIA label for content", "Example modal content"),
    },
    modalFooter: {
      primaryButtonText: text(
        "Primary button text (primaryButtonText in <ModalFooter>)",
        "Save"
      ),
      primaryButtonDisabled: boolean(
        "Primary button disabled (primaryButtonDisabled in <ModalFooter>)",
        false
      ),
      secondaryButtonText: text(
        "Secondary button text (secondaryButtonText in <ModalFooter>)",
        ""
      ),
    },
  },
});
