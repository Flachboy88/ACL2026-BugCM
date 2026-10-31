import path from "path";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import agendasRouter from "./routes/agendas.js";
import activitesRouter from "./routes/activites.js";
import registerRouter from "./routes/register.js";
import loginRouter from "./routes/login.js";

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

// 
app.use("/", registerRouter);
app.use("/", loginRouter);

// API routers: agendas and their activities (only for logged in users)
app.use("/api", requireApiLogin);
app.use("/api", agendasRouter);
app.use("/api", activitesRouter);

// Assets statiques : seulement css et js (pas views/, sinon les .ejs seraient exposés)
app.use("/css", express.static(path.join(CLIENT_FOLDER, "css")));
app.use("/js", express.static(path.join(CLIENT_FOLDER, "js")));

// Web pages (rendered with EJS)
app.get("/", requireLogin, function (request, response) {
    response.render("index");
});

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

export default app;
