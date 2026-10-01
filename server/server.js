const path = require("path");
const express = require("express");

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

app.listen(PORT, function () {
    console.log("Server started on http://localhost:" + PORT);
});
