describe('Basic React App', () => {
    it('should logo with alt text', () => {
        cy.visit('http://localhost:3000/')
        cy.get('[data-logo="app logo"]')
            .invoke('attr', 'alt')
            .should('equal', 'logo')

    })
  })
  