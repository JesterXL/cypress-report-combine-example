describe('Basic React App', () => {
    it('should have link to React', () => {
        cy.visit('http://localhost:3000/')
        cy.get('[data-applink="sup"]')
            .invoke('attr', 'href')
            .should('equal', 'https://reactjs.org')

    })
  })
  