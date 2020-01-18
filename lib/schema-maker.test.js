import SchemaMaker from './schema-maker'
import chai, { expect } from 'chai'
import chaiString from 'chai-string'

chai.use(chaiString)

describe('SchemaMaker', () => {

  const dbPath = 'db.test.json'
  const schemaMaker = new SchemaMaker(dbPath)

  describe('#_generateId', () => {
    it('should generate unique id for object.', () => {
      const n = Math.floor(Math.random() * 100 + 1)
      const rows = [{ id: n }]
      const id = schemaMaker._generateId(rows)
      expect(id).to.equal(n + 1)
    })
  })

  describe('#_makeFieldTypes', () => {
    it('should generate valid field types.', () => {
      const seeds = [
        {
          id: 1,
          title: 'Naruto',
          rating: 90.6,
          episodes: 12,
          manga: true
        },
        {
          id: 1,
          name: 'Berserk'
        }
      ]
      const expectedCreateFieldTypes = [
        'id: Int, title: String!, rating: Float!, episodes: Int!, manga: Boolean!',
        'id: Int, name: String!'
      ]

      const expectedUpdateFieldTypes = [
        'id: Int!, title: String, rating: Float, episodes: Int, manga: Boolean',
        'id: Int!, name: String'
      ]
      seeds.forEach((row, i) => {
        const createFieldTypes = schemaMaker._makeFieldTypes(row, 'create')
        expect(createFieldTypes).to.equal(expectedCreateFieldTypes[i])
        const updateFieldTYpes = schemaMaker._makeFieldTypes(row, 'update')
        expect(updateFieldTYpes).to.equal(expectedUpdateFieldTypes[i])
      })
    })
  })

  describe('#_validateSeeds', () => {
    it('should return false if seeds are invalid.', () => {
      const seedsWithoutId = [
        {
          qty: 7,
          label: 'Sold'
        }
      ]
      const emptySeeds = [{}]
      const noSeeds = []
      const invalidSeeds = {}
      expect(schemaMaker._validateSeeds(seedsWithoutId)).to.be.false
      expect(schemaMaker._validateSeeds(emptySeeds)).to.be.false
      expect(schemaMaker._validateSeeds(noSeeds)).to.be.false
      expect(schemaMaker._validateSeeds(invalidSeeds)).to.be.false
    })
    it('should return true if seeds are valid.', () => {
      const validSeeds = [
        {
          id: 199,
          qty: 7,
          label: 'Sold'
        }
      ]
      expect(schemaMaker._validateSeeds(validSeeds)).to.be.true
    })
  })

  describe('#makeTypeDefs', () => {
    it('should generate valid typeDefs.', () => {
      const fakeDb = {
        users: [
          {
            id: 1,
            email: 'test@mail.com',
            password: 'secretcat'
          }
        ],
        roles: [
          {
            id: 1,
            title: 'admin'
          }
        ]
      }
      const fakeModels = [
        'users',
        'roles'
      ]
      const makeTypeDefs = schemaMaker.makeTypeDefs.bind({
        db: fakeDb,
        models: fakeModels,
        _validateSeeds: schemaMaker._validateSeeds,
        _makeFieldTypes: schemaMaker._makeFieldTypes
      })
      const typeDefs = makeTypeDefs()
      const expectedTypeDefs = `
        type Query {
          allUsers: [User]!
          User(id: Int!): User
          allRoles: [Role]!
          Role(id: Int!): Role
        }
        type Mutation {
          createUser(id: Int, email: String!, password: String!): User!
          updateUser(id: Int!, email: String, password: String): User
          deleteUser(id: Int): Boolean!
          createRole(id: Int, title: String!): Role!
          updateRole(id: Int!, title: String): Role
          deleteRole(id: Int): Boolean!
        }
        type User {
          id: Int
          email: String!
          password: String!
        }
        type Role {
          id: Int
          title: String!
        }
      `
      expect(typeDefs).to.equalIgnoreSpaces(expectedTypeDefs)
    })
  })

  describe('#makeResolvers', () => {
    it('should generate valid resolvers.', () => {
      const fakeDb = {
        todos: [
          {
            id: 1,
            text: 'Get some sleep',
            completed: false
          }
        ]
      }
      const fakeModels = [
        'todos'
      ]
      const makeResolvers = schemaMaker.makeResolvers.bind({
        db: fakeDb,
        models: fakeModels,
        _validateSeeds: schemaMaker._validateSeeds,
        _makeFieldTypes: schemaMaker._makeFieldTypes
      })
      const resolvers = makeResolvers()
      const { Query, Mutation } = resolvers
      expect(Query).to.be.an('object')
      expect(Mutation).to.be.an('object')
      expect(Query).to.have.all.keys('Todo', 'allTodos')
      expect(Mutation).to.have.all.keys('createTodo', 'updateTodo', 'deleteTodo')
    })
  })
})
