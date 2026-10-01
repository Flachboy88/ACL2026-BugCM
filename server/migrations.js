const fs = require("fs");
const path = require("path");
const database = require("./database");

const MIGRATIONS_FOLDER = path.join(__dirname, "..", "database", "migrations");

// Runs, in order, every migration file that has not been applied to the database yet
async function runMigrations() {
    // This table remembers which migration files have already been applied
    await database.query(
        "CREATE TABLE IF NOT EXISTS migration (" +
        "  file_name TEXT PRIMARY KEY," +
        "  applied_at TIMESTAMP NOT NULL DEFAULT NOW()" +
        ")"
    );

    const result = await database.query("SELECT file_name FROM migration");
    const appliedFiles = result.rows.map(function (row) {
        return row.file_name;
    });

    // Files are named 001_xxx.sql, 002_xxx.sql... so sorting them gives the right order
    const migrationFiles = fs.readdirSync(MIGRATIONS_FOLDER)
        .filter(function (fileName) {
            return fileName.endsWith(".sql");
        })
        .sort();

    for (const fileName of migrationFiles) {
        if (!appliedFiles.includes(fileName)) {
            await applyMigration(fileName);
        }
    }
}

// Applies one migration file inside a transaction: either the whole file works, or nothing changes
async function applyMigration(fileName) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_FOLDER, fileName), "utf8");
    const client = await database.connect();

    try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO migration (file_name) VALUES ($1)", [fileName]);
        await client.query("COMMIT");
        console.log("Migration applied: " + fileName);
    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error("Migration " + fileName + " failed: " + error.message);
    } finally {
        client.release();
    }
}

module.exports = runMigrations;
