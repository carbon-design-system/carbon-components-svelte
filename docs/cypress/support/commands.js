Cypress.Commands.add("examples", (component) => {
  cy.visit(`/examples/${component}`, {
    onBeforeLoad(win) {
      cy.stub(win.console, "log").as("log");
    },
  });
});
