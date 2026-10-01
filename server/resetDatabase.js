// Deletes the local database file. The next "npm start" recreates it and applies every migration.
// Used by "npm run db:reset". The server must be stopped first.
const fs = require("fs");
const path = require("path");

// Same file as in server/database.js
const DATABASE_FILE = path.join(__dirname, "..", "data", "agenda.db");

if (!fs.existsSync(DATABASE_FILE)) {
    console.log("No database to delete.");
} else {
    try {
        fs.rmSync(DATABASE_FILE);
        console.log("Database deleted. Run \"npm start\" to recreate it.");
    } catch (error) {
        console.error("Could not delete the database. Is the server still running? Stop it and try again.");
        process.exit(1);
    }
}
