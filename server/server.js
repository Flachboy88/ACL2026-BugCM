import "./setup_env.js";
import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import runMigrations from "./migrations.js";

const PORT = 3000;

const server = createServer(app);

// Updates the database tables first, then starts the web server
try {
    runMigrations();
} catch (error) {
    console.error("Could not prepare the database: " + error.message);
    console.error("Check the files in database/migrations.");
    process.exit(1);
}

server.listen(PORT, function () {
    console.log("Server started on http://localhost:" + PORT);
});
