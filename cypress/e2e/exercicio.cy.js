/// <reference types="cypress" />

import 'cypress-plugin-api'
import '../fixtures/response_body_livro.json'

describe('Testes da Funcionalidade Catálogo de Livros', () => {
     let token
     beforeEach(() => {
          cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
               token = tkn
          })
     });

     // Objetivo: Verificar que a API retorna lista de livros com paginação e filtros funcionando
     // Validar que filtros por categoria e autores funcionam corretamente
     it('GET - Deve listar livros com filtros e paginação', () => {
          cy.api({
               method: 'GET',
               url: 'books',
               qs: {
                    category: 'Literatura Brasileira',
                    author: 'Machado de Assis',
                    limit: 5,
                    page: 1
               }
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.filters).to.have.property('category')
               expect(response.body.filters).to.have.property('author')
          })
     });

     // Objetivo: Validar que é possível obter detalhes de um livro específico pelo ID
     // Verificar que todos os campos do livro são retornados corretamente
     it('GET - Deve listar detalhes de um livro específico', () => {
          cy.fixture('response_body_livro.json').then((responseLivro) => {
               cy.api({
                    method: 'GET',
                    url: 'books/1',
               }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body).to.deep.equal(responseLivro)
               })
          })

     });

     // Objetivo: Validar que um novo livro é adicionado com sucesso ao catálogo
     // Verificar que apenas admin pode adicionar novos livros (validação de permissão)
     it('POST - Deve cadastrar um novo livro com sucesso', () => {
          let numero = Cypress._.random(100, 1000)
          cy.api({
               method: 'POST',
               url: 'books',
               headers: { 'Authorization': token },
               body: {
                    "title": "O Cortiço " + numero, // Variável criada para não cair na regra de negócio de duplicidade no título.
                    "author": "Aluísio Azevedo",
                    "description": "Romance naturalista que retrata a vida em um cortiço",
                    "category": "Literatura Brasileira"
               }
          }).should(response => {
               expect(response.status).to.equal(201)
               expect(response.body.message).to.equal('Livro criado com sucesso.')
          })
     });

     // Objetivo: Garantir que dados inválidos são rejeitados ao adicionar um livro
     // Validar mensagens de erro apropriadas para dados faltantes ou incorretos
     const cenariosInvalidos = [
          {
               descricao: 'título duplicado',
               body: {
                    title: "O Cortiço.",
                    author: "Aluísio Azevedo",
                    description: "Romance naturalista que retrata a vida em um cortiço",
                    category: "Literatura Brasileira"
               },
               mensagemEsperada: 'Já existe um livro com este título e autor.'
          },
          {
               descricao: 'author null',
               body: {
                    title: "Novo Livro Teste",
                    description: "Descrição válida",
                    category: "Literatura Brasileira"
               },
               mensagemEsperada: '"author" is required'
          },
          {
               descricao: 'title null',
               body: {
                    description: "Descrição válida",
                    category: "Literatura Brasileira"
               },
               mensagemEsperada: '"title" is required'
          }

     ];

     cenariosInvalidos.forEach(cenario => {
          it(`POST - Deve rejeitar livro com ${cenario.descricao}`, () => {
               cy.api({
                    method: 'POST',
                    url: 'books',
                    headers: { 'Authorization': token },
                    body: cenario.body,
                    failOnStatusCode: false
               }).should(response => {
                    expect(response.body.message).to.contain(cenario.mensagemEsperada)
               })
          });
     });

     // Objetivo: Validar que um livro pode ser atualizado com sucesso
     // Verificar que apenas admin pode atualizar livros (validação de permissão)
     it('PUT - Deve atualizar um livro previamente cadastrado', () => {
          cy.api({
               method: 'PUT',
               url: 'books/2',
               headers: { 'Authorization': token },
               body: {
                    "title": "Um novo livro para teste",
                    "author": "Autor Teste"
               }
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.message).to.equal('Livro atualizado com sucesso.')
          })
     });

     // Objetivo: Validar que um livro pode ser removido do catálogo
     // Verificar que apenas admin pode deletar livros (validação de permissão)
     it('DELETE - Deve deletar um livro previamente cadastrado', () => {
          cy.incluirLivro('Um livro para teste' , 'Autor Teste', 'Descrição Teste', 'Categoria Teste')
               .then(({ id, token }) => {
                    cy.api({
                         method: 'DELETE',
                         url: `books/${id}`,
                         headers: { 'Authorization': token }
                    }).should(response => {
                         expect(response.status).to.equal(200)
                         expect(response.body.message).to.contain('Livro deletado com sucesso.')
                    })
               })
     });
})
