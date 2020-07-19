Cypress.Commands.add("examples", (component) => {
  cy.visit(`/examples/${component}`);
});
