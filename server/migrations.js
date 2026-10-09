import fs from "fs";
import path from "path";
import database from "./database.js";

const MIGRATIONS_FOLDER = path.join(__dirname, "..", "database", "migrations");

// Runs, in order, every migration file that has not been applied to the database yet
function runMigrations() {
    // This table remembers which migration files have already been applied
    database.exec(
        "CREATE TABLE IF NOT EXISTS migration (" +
        "  file_name TEXT PRIMARY KEY," +
        "  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" +
        ")"
    );

    const appliedFiles = database.prepare("SELECT file_name FROM migration").all()
        .map(function (row) {
            return row.file_name;
        });

    // Files are named 001_xxx.sql, 002_xxx.sql... so sorting them gives the right order
    const migrationFiles = fs.readdirSync(MIGRATIONS_FOLDER)
        .filter(function (fileName) {
            return fileName.endsWith(".sql");
        })
        .sort();

    // Foreign keys are turned off while tables change: SQLite needs this to rebuild a table.
    // They are checked at the end of each migration, then turned back on.
    database.pragma("foreign_keys = OFF");
    try {
        for (const fileName of migrationFiles) {
            if (!appliedFiles.includes(fileName)) {
                applyMigration(fileName);
            }
        }
    } finally {
        database.pragma("foreign_keys = ON");
    }
}

// Applies one migration file inside a transaction: either the whole file works, or nothing changes
function applyMigration(fileName) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_FOLDER, fileName), "utf8");

    const applyInTransaction = database.transaction(function () {
        database.exec(sql);

        const foreignKeyProblems = database.pragma("foreign_key_check");
        if (foreignKeyProblems.length > 0) {
            throw new Error("some rows point to rows that do not exist (foreign keys)");
        }

        database.prepare("INSERT INTO migration (file_name) VALUES (?)").run(fileName);
    });

    try {
        applyInTransaction();
        console.log("Migration applied: " + fileName);
    } catch (error) {
        throw new Error("Migration " + fileName + " failed: " + error.message);
    }
}

export default runMigrations;
