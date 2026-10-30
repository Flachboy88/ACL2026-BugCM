import path from "path";
import express from "express";
import database from "./database.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import agendasRouter from "./routes/agendas.js";
import activitesRouter from "./routes/activites.js";
import bcrypt from "bcrypt";

const CLIENT_FOLDER = path.join(import.meta.dirname, "..", "client");

// Builds the Express app without starting it: server.js starts it, the tests start their own copy
const app = express();

// Engine for templeate (include header), page are in client/views
app.set("view engine", "ejs");
app.set("views", path.join(CLIENT_FOLDER, "views"));

// Lets the API read JSON sent by the client
app.use(express.json());
// Reads the token cookie before any route, so every route knows the user
app.use(cookieParser()).use(auth);

// API routers: agendas and their activities (only for logged in users)
app.use("/api", requireApiLogin);
app.use("/api", agendasRouter);
app.use("/api", activitesRouter);

app.post("/login", function (request, response){
    // request.body is undefined when the client does not send JSON
    const {email, password} = request.body ?? {};
    if(!isFilled(email) || !isFilled(password)){
        return response.status(400).json({erreur: "Champs manquants"});
    }
    const user = database.prepare("SELECT * FROM utilisateur WHERE email = ?").get(email);
    if(typeof(user) === "undefined" || !bcrypt.compareSync(password, user.mot_de_passe_hash)){
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
            const passwordHash = bcrypt.hashSync(password,10);
            const user = database.prepare("INSERT INTO utilisateur (nom, email, mot_de_passe_hash) VALUES (?, ?, ?)").run(userName, email, passwordHash);
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

app.post("/logout" ,function logout(req,res) {
    res.cookie('accessToken', null);
    res.redirect('/login');
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

// Creates a signed token with the user id and name, valid 30 minutes
function createJWT(user){
    return jwt.sign({id: user.id, username: user.username}, process.env.SECRET, {expiresIn: "30m"});
}

// Puts the user of a valid token in res.locals.user (stays undefined otherwise)
function auth(req, res, next){
    try {
        const token = req.cookies.accessToken;
        const user = jwt.verify(token, process.env.SECRET);
        res.locals.user = user;
    } catch {

    }
    next();
}

// Pages: sends a visitor who is not logged in to the login page
function requireLogin(req, res, next){
    if(res.locals.user === undefined){
        return res.redirect("/login");
    }
    next();
}

// API: answers 401 to a visitor who is not logged in (no redirect, the client expects JSON)
function requireApiLogin(req, res, next){
    if(res.locals.user === undefined){
        return res.status(401).json({erreur: "Non connecté"});
    }
    next();
}

// Pages: a logged in user does not need the login or register page
function redirectIfLogin(req, res, next){
    if(res.locals.user !== undefined){
        return res.redirect("/");
    }
    next();
}

export default app;
