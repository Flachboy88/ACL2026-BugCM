const path = require("path");
const express = require("express");
const runMigrations = require("./migrations");

const PORT = 3000;
const CLIENT_FOLDER = path.join(__dirname, "..", "client");

const app = express();

// Lets the API read JSON sent by the client
app.use(express.json());

// API routes: everything under /api
app.get("/api/status", function (request, response) {
    response.json({ status: "ok" });
});

// Web pages: everything else is served from the client folder
app.use(express.static(CLIENT_FOLDER));

// Updates the database tables first, then starts the web server
try {
    runMigrations();
} catch (error) {
    console.error("Could not prepare the database: " + error.message);
    console.error("Check the files in database/migrations.");
    process.exit(1);
}

app.listen(PORT, function () {
    console.log("Server started on http://localhost:" + PORT);
});
