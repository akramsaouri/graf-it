import fs from 'fs'
import capitalize from 'lodash/capitalize'
import { plural, singular } from 'pluralize'

class SchemaMaker {
  /**
   * Load new json db
   * @param {string} dbPath 
   */
  load(dbPath) {
    this.dbPath = dbPath
    this.db = JSON.parse(fs.readFileSync(dbPath))
    this.models = Object.keys(this.db)
  }
  /**
   * Generate typeDefs from seeds
   * @return {string}
   */
  makeTypeDefs() {
    const strings = this.models.reduce((obj, model) => {
      if (!obj[model]) {
        obj[model] = {}
      }
      obj[model].type = capitalize(singular(model))
      obj[model].pluralType = plural(obj[model].type)
      const seeds = this.db[model]
      if (!this._validateSeeds(seeds)) {
        throw new Error('Invalid seeds in JSON file.')
      }
      // consider first seeds entry as a model structure
      const structure = seeds[0]
      obj[model].createFieldTypes = this._makeFieldTypes(structure, 'create')
      obj[model].updateFieldTypes = this._makeFieldTypes(structure, 'update')
      return obj
    }, {})
    return `
      type Query {
        ${this.models.map(model => `
          all${strings[model].pluralType}: [${strings[model].type}]!
          ${strings[model].type}(id: Int): ${strings[model].type}
        `).join('')}
      }
      type Mutation {
        ${this.models.map(model => `
          create${strings[model].type}(${strings[model].createFieldTypes}): ${strings[model].type}!
          update${strings[model].type}(${strings[model].updateFieldTypes}): ${strings[model].type}
          delete${strings[model].type}(id: Int): Boolean!
        `).join('')}
      }
      ${this.models.map(model => `
        type ${strings[model].type} {
          ${strings[model].createFieldTypes.split(',').join('\n')}
        }
      `).join('')}
    `
  }
  /**
   * Generate resolvers from seeds
   * @return {object}
   */
  makeResolvers() {
    const strings = this.models.reduce((obj, model) => {
      if (!obj[model]) {
        obj[model] = {}
      }
      obj[model].type = capitalize(singular(model))
      obj[model].pluralType = plural(obj[model].type)
      const seeds = this.db[model]
      if (!this._validateSeeds(seeds)) {
        throw new Error('Seeds Error.')
      }
      obj[model].createFieldTypes = this._makeFieldTypes(seeds[0], 'create')
      obj[model].updateFieldTypes = this._makeFieldTypes(seeds[0], 'update')
      return obj
    }, {})

    const resolvers = this.models.reduce((obj, model) => {
      const { type, pluralType } = strings[model]

      // Query.allRows
      obj.Query[`all${pluralType}`] = () => {
        return this.db[model]
      }

      // Query.Row
      obj.Query[`${type}`] = (_, { id }) => {
        return this.db[model].find(r => r.id === id)
      }

      // Mutation.createRow
      obj.Mutation[`create${type}`] = (_, args) => {
        const id = this._generateId(this.db[model])
        args = { id, ...args }
        this.db[model].push(args)
        this.write()
        return args
      }

      // Mutation.updateRow
      obj.Mutation[`update${type}`] = (_, args) => {
        let record
        this.db[model] = this.db[model].map(row => {
          if (row.id === args.id) {
            row = { ...row, ...args }
            record = row
          }
          return row
        })
        this.write()
        return record
      }

      // Mutation.deleteRow
      obj.Mutation[`delete${type}`] = (_, { id }) => {
        const oldLength = this.db[model].length
        this.db[model] = this.db[model].filter(row => row.id !== id)
        this.write()
        return oldLength > this.db[model].length
      }

      return obj

    }, {
        Query: {},
        Mutation: {}
      })
    return resolvers
  }
  /**
   * Write changes to json db
   */
  write() {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2))
  }
  /**
   * Generate field types from seeds
   * @param {object} row
   * @param {enum} type [create, update]
   * @return {string}
   */
  _makeFieldTypes(row, type) {
    return Object.keys(row).map(field => {
      let fieldType
      switch (typeof row[field]) {
        case 'string':
          fieldType = `${field}: String`
          break
        case 'number':
          fieldType = row[field] % 1 === 0 ? `${field}: Int` : `${field}: Float`
          break
        case 'boolean':
          fieldType = `${field}: Boolean`
          break
      }
      if ((type === 'create' && field !== 'id') || (type === 'update' && field === 'id')) {
        fieldType = fieldType.concat('!')
      }
      return fieldType
    }).join(', ')
  }
  /**
   * Generate incremental id, assumes previous row has id field
   * @param {array} rows
   * @return {int}
   */
  _generateId(rows) {
    return rows[rows.length - 1].id + 1
  }
  /**
   * Ensure seeds are not empty and contains at least an id field
   * @param {object} rows 
   */
  _validateSeeds(rows) {
    return rows.length > 0 && rows.every(r => r.id)
  }
}

export default SchemaMaker
