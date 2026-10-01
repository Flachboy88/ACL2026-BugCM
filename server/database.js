const { Pool } = require("pg");

// One pool of connections to PostgreSQL, shared by the whole server.
// Use it with: const database = require("./database"); await database.query("SELECT ...");
const database = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "agenda",
    password: process.env.DB_PASSWORD || "agenda",
    database: process.env.DB_NAME || "agenda"
});

module.exports = database;
