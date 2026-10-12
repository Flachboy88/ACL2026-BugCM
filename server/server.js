import path from "path";
import express from "express";
import runMigrations from "./migrations.js"
import database from "./database.js";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import agendasRouter from "./routes/agendas.js";
import activitesRouter from "./routes/activites.js";

dotenv.config();
const PORT = 3000;
const CLIENT_FOLDER = path.join(import.meta.dirname, "..", "client");

const app = express();
const server = createServer(app);

// Engine for templeate (include header), page are in client/views
app.set("view engine", "ejs");
app.set("views", path.join(CLIENT_FOLDER, "views"));

// Lets the API read JSON sent by the client
app.use(express.json());
// API routers: agendas and their activities
app.use("/api", agendasRouter);
app.use("/api", activitesRouter);
app.use(cookieParser()).use(auth);

// Web pages: everything else is served from the client folder
app.use(express.static(CLIENT_FOLDER));

app.post("/login", function (request, response){
    // request.body is undefined when the client does not send JSON
    const {email, password} = request.body ?? {};
    if(!isFilled(email) || !isFilled(password)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
    const user = database.prepare("SELECT * FROM utilisateur WHERE email = ? AND mot_de_passe_hash = ?").get(email, password);
    if(typeof(user) === "undefined"){
        return response.status(401).json({erreur: "Identifiants incorrects"});
    } else {
        const token = createJWT({id: user["id_utilisateur"], username: user.nom});
        const lifetime = 1000 * 60 * 30;
        response.cookie("accessToken", token, {httpOnly: true, maxAge: lifetime});
        return response.status(200).json({path: "/"});
    }
});

app.post("/register", function (request, response){
    const {userName, email, password, confirmPassword} = request.body ?? {};
    if(!isFilled(userName) || !isFilled(email) || !isFilled(password) || !isFilled(confirmPassword)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
    const userExists = database.prepare("SELECT email FROM utilisateur WHERE email = ?").get(email);
    if(typeof(userExists) === "undefined"){
        if(password === confirmPassword){
            const user = database.prepare("INSERT INTO utilisateur (nom, email, mot_de_passe_hash) VALUES (?, ?, ?)").run(userName, email, password);
            const lifetime = 1000 * 60 * 30;
            const token = createJWT({id: user.lastInsertRowid, username: userName});
            response.cookie("accessToken", token, {httpOnly: true, maxAge: lifetime});
            return response.status(200).json({path: "/"});
        } else {
            return response.status(400).json({erreur: "Mot de passe différents"});
        }
    } else {
        return response.status(400).json({erreur: "Email déjà pris"});
    }
});

// Web pages (rendered with EJS)
app.get("/", requireLogin, function (request, response) {
    response.render("index");
});
app.get("/login", redirectIfLogin, function (request, response) {
    response.render("login");
});
app.get("/register", redirectIfLogin, function (request, response) {
    response.render("register");
});

// Assets statiques : seulement css et js (pas views/, sinon les .ejs seraient exposés)
app.use("/css", express.static(path.join(CLIENT_FOLDER, "css")));
app.use("/js", express.static(path.join(CLIENT_FOLDER, "js")));

// True when the client sent a non-empty text for this field
function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

function createJWT(user){
    return jwt.sign({id: user.id, username: user.username}, process.env.SECRET, {expiresIn: "30m"});
}

function auth(req, res, next){
    try {
        const token = req.cookies.accessToken;
        const user = jwt.verify(token, process.env.SECRET);
        res.locals.user = user;
    } catch {
      
    }
    next();
}

function requireLogin(req, res, next){
    if(res.locals.user === undefined){
        return res.redirect("/login");
    }
    next();
}

function redirectIfLogin(req, res, next){
    if(res.locals.user !== undefined){
        return res.redirect("/");
    }
    next();
}

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
