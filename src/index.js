#!/usr/bin/env node

import yargs from 'yargs'
import SchemaMaker from './lib/schema-maker'
import { makeExecutableSchema } from 'graphql-tools'
import express from 'express'
import graphqlHTTP from 'express-graphql'
import cors from 'cors'

// read cli args
const { argv } = yargs
  .demandCommand(1)
  .usage('Usage: $0 db --port <port> ')
  .default('port', 3000)

const { port, _ } = argv
const [db] = _

// generate graphql schema from the json db
const schemaMaker = new SchemaMaker()
schemaMaker.load(db)
const typeDefs = schemaMaker.makeTypeDefs()
const resolvers = schemaMaker.makeResolvers()
const schema = makeExecutableSchema({ typeDefs, resolvers })

// start graphql http server
const app = express()

app.use(cors())
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
  })
)

app.listen(port, () => {
  console.log(`GraphQL server started at http://localhost:${port}/graphql`)
})
