const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_FOLDER = path.join(__dirname, "..", "data");
const DATABASE_FILE = path.join(DATA_FOLDER, "agenda.db");

// The data folder is not in Git, so it may not exist yet
fs.mkdirSync(DATA_FOLDER, { recursive: true });

// Opens the database file (SQLite creates it if it does not exist yet).
// Use it with: const database = require("./database"); database.prepare("SELECT ...").all();
const database = new Database(DATABASE_FILE);

// SQLite ignores foreign keys unless we turn them on
database.pragma("foreign_keys = ON");

module.exports = database;
