const path = require("path");
const express = require("express");
const runMigrations = require("./migrations");

const PORT = 3000;
const CLIENT_FOLDER = path.join(__dirname, "..", "client");

const app = express();

// Engine for templeate (include header), page are in client/views
app.set("view engine", "ejs");
app.set("views", path.join(CLIENT_FOLDER, "views"));

// Lets the API read JSON sent by the client
app.use(express.json());

// API routes: everything under /api
app.get("/api/status", function (request, response) {
    response.json({ status: "ok" });
});

// Web pages: everything else is served from the client folder
//app.use(express.static(CLIENT_FOLDER));
// Web pages (render with EJS)
// TODO: remplacer par la vraie vérification de session (autre personne)
function isLoggedIn(request) {
    return false;
}

function requireAuth(request, response, next) {
    if (isLoggedIn(request)) return next();
    response.redirect("/login");
}

function requireGuest(request, response, next) {
    if (isLoggedIn(request)) return response.redirect("/");
    next();
}

app.get("/", requireAuth, function (request, response) {
    response.render("index");
});
app.get("/login", requireGuest, function (request, response) {
    response.render("login");
});
app.get("/register", requireGuest, function (request, response) {
    response.render("register");
});

// Assets statiques : seulement css et js (pas views/, sinon les .ejs seraient exposés)
app.use("/css", express.static(path.join(CLIENT_FOLDER, "css")));
app.use("/js", express.static(path.join(CLIENT_FOLDER, "js")));

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
