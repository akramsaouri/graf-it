# graph-it

## Install 
`npm install -g graf-it`

graf-it allows you to quickly generate a mock GraphQL API without writing a single line of code, good for quick prototyping and u know...stuff.

## Example

Create a `db.json` file:

```
{
    "todos": [
        { "id": 4, "completed": false, "text": "Get some sleep" }
    ],
    "users": [
        { "id": 6, "email": "cat@mail.com", "password": "secretcat" }
    ]
}
```

Start GraphQL Server:

`$ graf-it db.json`

Tada! You now have a GraphiQL server starting at your http://localhost:3000/graphql where you can query and mutate models for this db.

## Queries and Mutations

Based on the previous `db.json` file, here are all the generated queries and mutations:

```
  # queries
  allTodos: [Todo]!
  Todo(id: Int): Todo
  allUsers: [User]!
  User(id: Int): User

  # mutations
  createTodo(id: Int, completed: Boolean!, text: String!): Todo!
  updateTodo(id: Int!, completed: Boolean, text: String): Todo
  deleteTodo(id: Int):Boolean!
  createUser(id: Int, email: Boolean!, password: String!): User!
  updateUser(id: Int!, email: Boolean, password: String): User
  deleteUser(id: Int):Boolean!
```

## Custom port

You can specify another port using the `--port` flag:

`$ graf-it db.json --port 9000`

## TODO

- Fix a bug where .00 Float are considered Int.
