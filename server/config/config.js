const colors = require('colors')

module.exports = {
  development: {
    username: "root",
    password: "D0n'tUseInProduction",
    database: "tapalong_db_1",
    host: "127.0.0.1",
    dialect: "mysql",
    logging: (msg) => { console.log(msg.blue) }
  },
  test: {
    username: "root",
    password: "D0n'tUseInProduction",
    database: "tapalong_db_1",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: "root",
    password: "password",
    database: "tapalong_db_1",
    host: "127.0.0.1",
    dialect: "mysql",
    logging: (msg) => { console.log(msg.blue) }
  }
}
